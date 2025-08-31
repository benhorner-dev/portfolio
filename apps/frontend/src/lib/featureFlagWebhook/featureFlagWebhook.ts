import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
	FeatureFlagWebhookAuthenticationError,
	FeatureFlagWebhookValidationError,
} from "@/lib/featureFlagWebhook/errors";
import {
	EnvSchema,
	SlackHeadersSchema,
	SlackRequestSchema,
} from "@/lib/featureFlagWebhook/schema";
import { getLogger } from "@/lib/logger";

const logger = getLogger("feature-flag-webhook");

export async function verifySlackSignature(
	body: string,
	timestamp: string,
	signature: string,
	signingSecret: string,
): Promise<boolean> {
	const currentTime = Math.floor(Date.now() / 1000);
	if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) {
		return false;
	}

	const baseString = `v0:${timestamp}:${body}`;
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(signingSecret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signatureBuffer = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(baseString),
	);

	const computedSignature = `v0=${Array.from(new Uint8Array(signatureBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;

	if (signature.length !== computedSignature.length) return false;

	let result = 0;
	for (let i = 0; i < signature.length; i++) {
		result |= signature.charCodeAt(i) ^ computedSignature.charCodeAt(i);
	}
	return result === 0;
}

export const verifyHeaders = async (request: NextRequest) => {
	const headerValidation = SlackHeadersSchema.safeParse({
		"x-slack-request-timestamp": request.headers.get(
			"x-slack-request-timestamp",
		),
		"x-slack-signature": request.headers.get("x-slack-signature"),
	});

	if (!headerValidation.success) {
		throw new FeatureFlagWebhookValidationError(
			JSON.stringify({
				error: "Missing required headers",
				details: headerValidation.error.issues.map((e) => e.message),
			}),
		);
	}

	const {
		"x-slack-request-timestamp": timestamp,
		"x-slack-signature": signature,
	} = headerValidation.data;

	return { timestamp, signature };
};

export const verifyBody = async (body: string) => {
	const parsedBody = JSON.parse(body);

	const requestValidation = SlackRequestSchema.safeParse(parsedBody);
	if (!requestValidation.success) {
		throw new FeatureFlagWebhookValidationError(
			JSON.stringify({
				error: "Invalid request format",
				details: requestValidation.error.issues.map((e) => e.message),
			}),
		);
	}

	const validatedRequest = requestValidation.data;

	if (validatedRequest.type === "url_verification") {
		return validatedRequest;
	}

	const messageText = validatedRequest.event.text;
	const gateUpdatePattern = /Gate.*?updated/i;
	const gateNameMatch = messageText.match(/\|([^>]+)>/);

	if (!gateUpdatePattern.test(messageText) || !gateNameMatch) {
		throw new FeatureFlagWebhookValidationError(
			JSON.stringify({
				error: "Invalid request format",
				details: "Message doesn't match gate update pattern",
			}),
		);
	}

	const gateName = gateNameMatch[1];
	const author = messageText.match(/Author: ([^)]+)/)?.[1];
	const changes = messageText.split("\n").slice(2).join("\n");

	logger.info("Statsig Gate update detected:", {
		gateName,
		author,
		changes,
		botId: validatedRequest.event.bot_id,
		channel: validatedRequest.event.channel,
		timestamp: validatedRequest.event.ts,
	});

	return validatedRequest;
};

export const featureFlagWebhook = async (request: NextRequest) => {
	const env = EnvSchema.parse(process.env);

	const { timestamp, signature } = await verifyHeaders(request);
	const body = await request.text();

	const isValid = await verifySlackSignature(
		body,
		timestamp,
		signature,
		env.SLACK_SIGNING_SECRET,
	);

	if (!isValid) {
		throw new FeatureFlagWebhookAuthenticationError("Invalid signature");
	}

	const validatedRequest = await verifyBody(body);

	if (validatedRequest.type === "url_verification") {
		return NextResponse.json({ challenge: validatedRequest.challenge });
	}

	revalidatePath("/");

	return NextResponse.json({ ok: true });
};
