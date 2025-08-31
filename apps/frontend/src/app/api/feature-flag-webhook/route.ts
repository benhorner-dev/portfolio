import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getLogger } from "@/lib/logger";

export const runtime = "edge";

const logger = getLogger("feature-flag-webhook");

const SlackHeadersSchema = z.object({
	"x-slack-request-timestamp": z.string(),
	"x-slack-signature": z.string(),
});

const UrlVerificationSchema = z.object({
	type: z.literal("url_verification"),
	challenge: z.string(),
});

const SlackEventSchema = z.object({
	type: z.literal("event_callback"),
	event: z.object({
		type: z.literal("message"),
		text: z.string(),
		subtype: z.literal("bot_message"),
		bot_id: z.string(),
		channel: z.string(),
		ts: z.string(),
	}),
});

const SlackRequestSchema = z.discriminatedUnion("type", [
	UrlVerificationSchema,
	SlackEventSchema,
]);

const EnvSchema = z.object({
	SLACK_SIGNING_SECRET: z.string().min(1),
});

async function verifySlackSignature(
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

export const POST = async (request: NextRequest) => {
	try {
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

		let parsedBody: unknown;
		try {
			parsedBody = JSON.parse(body);
		} catch (error) {
			logger.error("Invalid JSON:", error);
			return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
		}

		const requestValidation = SlackRequestSchema.safeParse(parsedBody);
		if (!requestValidation.success) {
			logger.error(
				"Invalid request structure:",
				requestValidation.error.issues,
			);
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
		const gateUpdatePattern =
			/\*Gate <https:\/\/logger\.statsig\.com\/[^|]+\|([^>]+)> updated\*/;
		const match = messageText.match(gateUpdatePattern);

		if (!match) {
			logger.warn("Message doesn't match gate update pattern:", messageText);
			return NextResponse.json(
				{ error: "Not a gate update message" },
				{ status: 400 },
			);
		}

		const gateName = match[1];
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

		return NextResponse.json({ ok: true });
	} catch (error) {
		logger.error("Webhook error:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
				},
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
};

export const GET = async () => {
	return NextResponse.json({
		message: "Slack webhook endpoint is healthy",
		timestamp: new Date().toISOString(),
	});
};
