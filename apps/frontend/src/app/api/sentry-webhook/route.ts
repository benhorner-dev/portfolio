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

export async function POST(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");
		const expectedToken = process.env.SENTRY_WEBHOOK_SECRET;

		if (!expectedToken) {
			console.error("SENTRY_WEBHOOK_SECRET not configured");
			return NextResponse.json(
				{ error: "Server configuration error" },
				{ status: 500 },
			);
		}

		if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
			console.error("Unauthorized webhook request");
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

		const sentryData: SentryAlert = await request.json();

		const slackMessage = formatSlackMessage(sentryData);

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

function formatSlackMessage(data: SentryAlert): SlackMessage {
	const severity = getSeverityEmoji(data.level);
	const environment = data.event.environment || "unknown";

	const slackMessage: SlackMessage = {
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: `${severity} Sentry Alert - ${data.project}`,
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

	// Get the fields section (second block)
	const fieldsBlock = slackMessage.blocks[1];
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
