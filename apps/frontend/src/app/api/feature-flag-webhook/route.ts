import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { featureFlagWebhook } from "@/lib/featureFlagWebhook";
import {
	FeatureFlagWebhookAuthenticationError,
	FeatureFlagWebhookValidationError,
} from "@/lib/featureFlagWebhook/errors";
import { getLogger } from "@/lib/logger";

export const runtime = "edge";

const logger = getLogger("feature-flag-webhook");

export const POST = async (request: NextRequest) => {
	try {
		return await featureFlagWebhook(request);
	} catch (error) {
		logger.error("Webhook error:", error);

		if (error instanceof FeatureFlagWebhookValidationError) {
			return NextResponse.json(
				{ error: "Validation failed", details: error.message },
				{ status: 400 },
			);
		}

		if (error instanceof FeatureFlagWebhookAuthenticationError) {
			return NextResponse.json(
				{ error: "Authentication failed", details: error.message },
				{ status: 401 },
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
		message: "Feature flag webhook endpoint is healthy",
		timestamp: new Date().toISOString(),
	});
};
