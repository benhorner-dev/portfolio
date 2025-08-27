import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

interface SentryAlert {
	id: string;
	project: string;
	culprit?: string;
	message: string;
	url?: string;
	level: string;
	event: {
		event_id: string;
		timestamp: string;
		environment?: string;
		tags?: Record<string, string>;
		user?: {
			email?: string;
			id?: string;
		};
	};
}

interface SlackBlock {
	type: string;
	text?: {
		type: string;
		text: string;
		emoji?: boolean;
	};
	fields?: Array<{
		type: string;
		text: string;
	}>;
	elements?: Array<{
		type: string;
		text: {
			type: string;
			text: string;
			emoji?: boolean;
		};
		url: string;
		style?: string;
	}>;
}

interface SlackMessage {
	text?: string;
	blocks?: SlackBlock[];
	username?: string;
	icon_emoji?: string;
}

interface SentryData {
	id: string;
	project?: string | { name: string };
	culprit?: string;
	title?: string;
	message?: string;
	permalink?: string;
	web_url?: string;
	level?: string;
	firstSeen?: string;
	lastSeen?: string;
	tags?: Record<string, string>;
}

interface SentryWebhookPayload {
	action: string;
	data: {
		issue?: SentryData;
		error?: SentryData;
	};
}

export async function POST(request: NextRequest) {
	try {
		// Get the raw body for signature verification
		const body = await request.text();
		const signature = request.headers.get("sentry-hook-signature");
		const clientSecret = process.env.SENTRY_CLIENT_SECRET;

		if (!clientSecret) {
			console.error("SENTRY_CLIENT_SECRET not configured");
			return NextResponse.json(
				{ error: "Server configuration error" },
				{ status: 500 },
			);
		}

		// Verify Sentry signature
		if (signature && !(await verifySignature(body, signature, clientSecret))) {
			console.error("Invalid Sentry signature");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
		if (!slackWebhookUrl) {
			console.error("SLACK_WEBHOOK_URL not configured");
			return NextResponse.json(
				{ error: "Slack webhook not configured" },
				{ status: 500 },
			);
		}

		// Parse the webhook payload
		const webhookData: SentryWebhookPayload = JSON.parse(body);

		// Extract issue/error data based on webhook resource type
		const resource = request.headers.get("sentry-hook-resource");
		const sentryData = extractSentryData(webhookData, resource);

		if (!sentryData) {
			console.log("Webhook received but no actionable data found");
			return NextResponse.json({ success: true, message: "No action needed" });
		}

		const slackMessage = formatSlackMessage(sentryData, webhookData.action);

		const slackResponse = await fetch(slackWebhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(slackMessage),
		});

		if (!slackResponse.ok) {
			throw new Error(`Slack API error: ${slackResponse.status}`);
		}

		return NextResponse.json({
			success: true,
			message: "Alert forwarded to Slack",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error processing Sentry webhook:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}

export async function GET() {
	return NextResponse.json({
		message: "Sentry webhook endpoint is healthy",
		timestamp: new Date().toISOString(),
	});
}

async function verifySignature(
	body: string,
	signature: string,
	secret: string,
): Promise<boolean> {
	try {
		// Create HMAC with SHA256
		const encoder = new TextEncoder();
		const key = encoder.encode(secret);
		const data = encoder.encode(body);

		const cryptoKey = await crypto.subtle.importKey(
			"raw",
			key,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);

		const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, data);

		const computedSignature = Array.from(new Uint8Array(signatureBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		return computedSignature === signature;
	} catch (error) {
		console.error("Signature verification error:", error);
		return false;
	}
}

function extractSentryData(
	webhookData: SentryWebhookPayload,
	resource: string | null,
): SentryAlert | null {
	console.log(webhookData);
	console.log(resource);
	if (resource !== "issue" && resource !== "error") {
		return null;
	}

	const data =
		resource === "issue" ? webhookData.data.issue : webhookData.data.error;

	if (!data) {
		return null;
	}

	// Extract project name safely
	let projectName = "Unknown Project";
	if (data.project) {
		if (typeof data.project === "string") {
			projectName = data.project;
		} else if (typeof data.project === "object" && data.project.name) {
			projectName = data.project.name;
		}
	}

	return {
		id: data.id,
		project: projectName,
		culprit: data.culprit,
		message: data.title || data.message || "No message",
		url: data.permalink || data.web_url,
		level: data.level || "error",
		event: {
			event_id: data.id,
			timestamp: data.firstSeen || data.lastSeen || new Date().toISOString(),
			environment: data.tags?.environment || "unknown",
			tags: data.tags || {},
			user: data.tags?.user ? { id: data.tags.user } : undefined,
		},
	};
}

function formatSlackMessage(data: SentryAlert, action?: string): SlackMessage {
	const severity = getSeverityEmoji(data.level);
	const environment = data.event.environment || "unknown";
	const actionText = action ? ` (${action})` : "";

	const slackMessage: SlackMessage = {
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: `${severity} Sentry Alert - ${data.project}${actionText}`,
					emoji: true,
				},
			},
			{
				type: "section",
				fields: [
					{
						type: "mrkdwn",
						text: `*Level:* ${data.level.toUpperCase()}`,
					},
					{
						type: "mrkdwn",
						text: `*Environment:* ${environment}`,
					},
					{
						type: "mrkdwn",
						text: `*Event ID:* ${data.event.event_id}`,
					},
					{
						type: "mrkdwn",
						text: `*Time:* ${new Date(data.event.timestamp).toLocaleString()}`,
					},
				],
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Message:* ${data.message}`,
				},
			},
		],
	};

	// Type-safe access to blocks
	if (!slackMessage.blocks) {
		return slackMessage;
	}

	// Get the fields section (second block) using optional chaining
	const fieldsBlock = slackMessage.blocks?.[1];
	if (fieldsBlock?.fields && Array.isArray(fieldsBlock.fields)) {
		// Add culprit if available
		if (data.culprit) {
			fieldsBlock.fields.push({
				type: "mrkdwn",
				text: `*Culprit:* \`${data.culprit}\``,
			});
		}

		// Add user info if available
		if (data.event.user?.email || data.event.user?.id) {
			const userInfo = data.event.user.email || data.event.user.id;
			fieldsBlock.fields.push({
				type: "mrkdwn",
				text: `*User:* ${userInfo}`,
			});
		}
	}

	// Add Sentry link button if URL available
	if (data.url) {
		slackMessage.blocks.push({
			type: "actions",
			elements: [
				{
					type: "button",
					text: {
						type: "plain_text",
						text: "View in Sentry",
						emoji: true,
					},
					url: data.url,
					style: "primary",
				},
			],
		});
	}

	return slackMessage;
}

function getSeverityEmoji(level: string): string {
	switch (level.toLowerCase()) {
		case "fatal":
		case "error":
			return "🚨";
		case "warning":
			return "⚠️";
		case "info":
			return "ℹ️";
		case "debug":
			return "🐛";
		default:
			return "📋";
	}
}
