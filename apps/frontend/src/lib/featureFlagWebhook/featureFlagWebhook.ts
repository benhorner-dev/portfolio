import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
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

export const featureFlagWebhook = async (request: NextRequest) => {
	const env = EnvSchema.parse(process.env);

	const headerValidation = SlackHeadersSchema.safeParse({
		"x-slack-request-timestamp": request.headers.get(
			"x-slack-request-timestamp",
		),
		"x-slack-signature": request.headers.get("x-slack-signature"),
	});

	if (!headerValidation.success) {
		logger.error("Invalid headers:", headerValidation.error.issues);
		return NextResponse.json(
			{
				error: "Missing required headers",
				details: headerValidation.error.issues.map((e) => e.message),
			},
			{ status: 400 },
		);
	}

	const {
		"x-slack-request-timestamp": timestamp,
		"x-slack-signature": signature,
	} = headerValidation.data;
	const body = await request.text();

	const isValid = await verifySlackSignature(
		body,
		timestamp,
		signature,
		env.SLACK_SIGNING_SECRET,
	);

	if (!isValid) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const parsedBody = JSON.parse(body);

	const requestValidation = SlackRequestSchema.safeParse(parsedBody);
	if (!requestValidation.success) {
		logger.error("Invalid request structure:", requestValidation.error.issues);
		return NextResponse.json(
			{
				error: "Invalid request format",
				details: requestValidation.error.issues.map(
					(e) => `${e.path.join(".")}: ${e.message}`,
				),
			},
			{ status: 400 },
		);
	}

	const validatedRequest = requestValidation.data;

	if (validatedRequest.type === "url_verification") {
		return NextResponse.json({ challenge: validatedRequest.challenge });
	}

	const messageText = validatedRequest.event.text;
	const gateUpdatePattern = /Gate.*?updated/i;
	const gateNameMatch = messageText.match(/\|([^>]+)>/);

	if (!gateUpdatePattern.test(messageText) || !gateNameMatch) {
		logger.warn("Message doesn't match gate update pattern:", messageText);
		return NextResponse.json({ ok: true });
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

	return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};
