import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getLogger, LogLevel } from "@/lib/logger";
import { Environment } from "../constants";
import {
	SERVER_LOGGER,
	USE_DEV_LOGGER_TO_AVOID_INFINTE_LOOP,
} from "./constants";
import {
	AuthenticationError,
	ConfigurationError,
	DomainError,
	SlackApiError,
} from "./errors";
import {
	SentryAlertSchema,
	SentryWebhookPayloadSchema,
	SlackMessageSchema,
} from "./schema";
import type { SentryAlert, SentryWebhookPayload, SlackMessage } from "./types";

const logger = getLogger(
	"benhorner-sentry-webhook",
	USE_DEV_LOGGER_TO_AVOID_INFINTE_LOOP,
	SERVER_LOGGER,
);

export const sentryWebhook = async (
	request: NextRequest,
	slackWebhookUrl?: string,
) => {
	try {
		const body = await request.text();
		const signature = request.headers.get("sentry-hook-signature");
		const clientSecret = process.env.SENTRY_CLIENT_SECRET;

		if (!clientSecret) {
			throw new ConfigurationError("SENTRY_CLIENT_SECRET not configured");
		}

		if (signature && !(await verifySignature(body, signature, clientSecret))) {
			throw new AuthenticationError("Invalid Sentry signature");
		}

		if (!slackWebhookUrl) {
			throw new ConfigurationError("SLACK_WEBHOOK_URL not configured");
		}

		const webhookData = parseWebhookPayload(body);

		const resource = request.headers.get("sentry-hook-resource");
		const sentryData = extractSentryData(webhookData, resource);

		if (!sentryData) {
			logger.info("Webhook received but no actionable data found");
			return NextResponse.json({ success: true, message: "No action needed" });
		}

		const validatedSentryData = SentryAlertSchema.parse(sentryData);
		const slackMessage = formatSlackMessage(
			validatedSentryData,
			webhookData.action,
		);

		const validatedSlackMessage = SlackMessageSchema.parse(slackMessage);

		await sendSlackMessage(slackWebhookUrl, validatedSlackMessage);

		return NextResponse.json({
			success: true,
			message: "Alert forwarded to Slack",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		logger.error("Error processing Sentry webhook:", error);

		if (error instanceof DomainError) {
			return NextResponse.json(
				{
					error: error.message,
					timestamp: new Date().toISOString(),
				},
				{ status: error.status },
			);
		}

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Validation error",
					details: error.issues,
					timestamp: new Date().toISOString(),
				},
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error: "Internal server error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
};

export const verifySignature = async (
	body: string,
	signature: string,
	secret: string,
): Promise<boolean> => {
	try {
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
		logger.error("Signature verification error:", error);
		return false;
	}
};

export const parseWebhookPayload = (rawBody: string): SentryWebhookPayload => {
	const parsed = JSON.parse(rawBody);
	return SentryWebhookPayloadSchema.parse(parsed);
};

export const extractSentryData = (
	webhookData: SentryWebhookPayload,
	resource: string | null,
): SentryAlert | null => {
	if (resource === "event_alert" && webhookData.data.event) {
		const event = webhookData.data.event;

		const tagsObj: Record<string, string> = {};
		if (event.tags) {
			event.tags.forEach(([key, value]) => {
				tagsObj[key] = value;
			});
		}

		return {
			id: event.event_id,
			project: event.project.toString(),
			culprit: event.culprit,
			message: event.title || event.message || "No message",
			url: event.web_url || event.url,
			level: event.level,
			event: {
				event_id: event.event_id,
				timestamp: event.datetime,
				environment: tagsObj.environment || "unknown",
				tags: tagsObj,
				user: event.user
					? {
							id: event.user.id,
							email: event.user.email,
						}
					: undefined,
			},
		};
	}

	if (resource === "issue" || resource === "error") {
		const data =
			resource === "issue" ? webhookData.data.issue : webhookData.data.error;

		if (!data) {
			return null;
		}

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
			level: data.level || LogLevel.ERROR,
			event: {
				event_id: data.id,
				timestamp: data.firstSeen || data.lastSeen || new Date().toISOString(),
				environment: data.tags?.environment || "unknown",
				tags: data.tags || {},
				user: data.tags?.user ? { id: data.tags.user } : undefined,
			},
		};
	}

	return null;
};
export const formatSlackMessage = (
	data: SentryAlert,
	action?: string,
): SlackMessage => {
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

	const fieldsBlock = slackMessage.blocks?.[1];
	if (fieldsBlock?.fields && Array.isArray(fieldsBlock.fields)) {
		if (data.culprit) {
			fieldsBlock.fields.push({
				type: "mrkdwn",
				text: `*Culprit:* \`${data.culprit}\``,
			});
		}

		if (data.event.user?.email || data.event.user?.id) {
			const userInfo = data.event.user.email || data.event.user.id;
			fieldsBlock.fields.push({
				type: "mrkdwn",
				text: `*User:* ${userInfo}`,
			});
		}
	}

	if (data.url) {
		slackMessage.blocks?.push({
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
};

const getSeverityEmoji = (level: string): string => {
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
};

export const sendSlackMessage = async (
	webhookUrl: string,
	message: SlackMessage,
	deps?: { fetchFn?: typeof fetch },
): Promise<void> => {
	const fetchFn = deps?.fetchFn ?? fetch;
	const response = await fetchFn(webhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(message),
	});
	if (!response.ok) {
		throw new SlackApiError(`Slack API error: ${response.status}`);
	}
};

export const getSlackWebhookUrl = () => {
	switch (process.env.VERCEL_ENV) {
		case Environment.PRODUCTION:
		case Environment.PREVIEW:
			return process.env.SLACK_WEBHOOK_URL;
		default:
			return undefined;
	}
};
