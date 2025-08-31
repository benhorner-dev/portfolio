import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

function verifySlackSignature(
	body: string,
	timestamp: string,
	signature: string,
	signingSecret: string,
): boolean {
	const currentTime = Math.floor(Date.now() / 1000);
	if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) {
		return false;
	}

	const baseString = `v0:${timestamp}:${body}`;
	const hmac = createHmac("sha256", signingSecret);
	hmac.update(baseString);
	const computedSignature = `v0=${hmac.digest("hex")}`;

	if (signature.length !== computedSignature.length) return false;

	let result = 0;
	for (let i = 0; i < signature.length; i++) {
		result |= signature.charCodeAt(i) ^ computedSignature.charCodeAt(i);
	}
	return result === 0;
}

export const POST = async (request: NextRequest) => {
	try {
		const body = await request.text();
		const timestamp = request.headers.get("x-slack-request-timestamp");
		const signature = request.headers.get("x-slack-signature");
		const signingSecret = process.env.SLACK_SIGNING_SECRET;

		if (!signingSecret) {
			return NextResponse.json(
				{ error: "Server configuration error" },
				{ status: 500 },
			);
		}

		if (!timestamp || !signature) {
			return NextResponse.json({ error: "Missing headers" }, { status: 400 });
		}

		if (!verifySlackSignature(body, timestamp, signature, signingSecret)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const parsedBody = JSON.parse(body);
		console.log("Parsed body:", parsedBody);

		if (parsedBody.type === "url_verification") {
			return NextResponse.json({ challenge: parsedBody.challenge });
		}

		if (
			parsedBody.type === "event_callback" &&
			parsedBody.event?.type === "message"
		) {
			if (
				!parsedBody.event.subtype &&
				!parsedBody.event.bot_id &&
				!parsedBody.event.thread_ts
			) {
				console.log("New message:", {
					text: parsedBody.event.text?.substring(0, 100),
					channel: parsedBody.event.channel,
					user: parsedBody.event.user,
					timestamp: parsedBody.event.ts,
				});
			}
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Webhook error:", error);
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
};

export const GET = async () => {
	return NextResponse.json({
		message: "Slack webhook endpoint is healthy",
		timestamp: new Date().toISOString(),
	});
};
