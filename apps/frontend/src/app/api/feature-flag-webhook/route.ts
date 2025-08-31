import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

export const POST = async (request: NextRequest) => {
	const body = await request.json();

	if (body.type === "url_verification") {
		return NextResponse.json({ challenge: body.challenge });
	}

	if (body.type === "event_callback" && body.event?.type === "message") {
		if (!body.event.subtype && !body.event.bot_id) {
			console.log("New message:", {
				text: body.event.text,
				channel: body.event.channel,
				user: body.event.user,
				timestamp: body.event.ts,
			});
		}
	}

	return NextResponse.json({ ok: true });
};

export const GET = async () => {
	return NextResponse.json({
		message: "Slack webhook endpoint is healthy",
		timestamp: new Date().toISOString(),
	});
};
