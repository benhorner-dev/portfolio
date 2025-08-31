import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { featureFlagWebhook } from "@/lib/featureFlagWebhook";
import { getLogger } from "@/lib/logger";

export const runtime = "edge";

const logger = getLogger("feature-flag-webhook");

export const POST = async (request: NextRequest) => {
	try {
		return await featureFlagWebhook(request);
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
