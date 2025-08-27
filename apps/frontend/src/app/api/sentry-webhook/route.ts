import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSlackWebhookUrl, sentryWebhook } from "@/lib/sentryWebhook";

export const runtime = "edge";

export const POST = async (request: NextRequest) => {
	const slackWebhookUrl = getSlackWebhookUrl();
	return sentryWebhook(request, slackWebhookUrl);
};

export const GET = async () => {
	return NextResponse.json({
		message: "Sentry webhook endpoint is healthy",
		timestamp: new Date().toISOString(),
	});
};
