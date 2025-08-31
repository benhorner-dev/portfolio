import type { NextResponse } from "next/server";
import { NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { featureFlagWebhook } from "@/lib/featureFlagWebhook";
import {
	FeatureFlagWebhookAuthenticationError,
	FeatureFlagWebhookValidationError,
} from "@/lib/featureFlagWebhook/errors";
import { getLogger, type Logger } from "@/lib/logger";

vi.mock("@/lib/featureFlagWebhook");
vi.mock("@/lib/logger", () => ({
	getLogger: vi.fn(),
}));

const mockFeatureFlagWebhook = vi.mocked(featureFlagWebhook);
const mockGetLogger = vi.mocked(getLogger);

describe("feature-flag-webhook route", () => {
	const mockLogger = {
		error: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockGetLogger.mockReturnValue(mockLogger as unknown as Logger);
	});

	let { GET, POST } = {} as unknown as {
		GET: () => Promise<NextResponse>;
		POST: (request: NextRequest) => Promise<NextResponse>;
	};

	beforeEach(async () => {
		const routeModule = await import("./route");
		GET = routeModule.GET;
		POST = routeModule.POST;
	});

	describe("POST", () => {
		it("returns successful response when featureFlagWebhook succeeds", async () => {
			const mockResponse = { success: true };
			mockFeatureFlagWebhook.mockResolvedValue(
				mockResponse as unknown as NextResponse<{ challenge: string }>,
			);

			const request = new NextRequest(
				"https://example.com/api/feature-flag-webhook",
			);
			const response = await POST(request);

			expect(mockFeatureFlagWebhook).toHaveBeenCalledWith(request);
			expect(response).toBe(mockResponse);
		});

		it("returns 400 when FeatureFlagWebhookValidationError occurs", async () => {
			const validationError = new FeatureFlagWebhookValidationError(
				"Invalid payload",
			);
			mockFeatureFlagWebhook.mockRejectedValue(validationError);

			const request = new NextRequest(
				"https://example.com/api/feature-flag-webhook",
			);
			const response = await POST(request);
			const responseData = await response.json();

			expect(mockLogger.error).toHaveBeenCalledWith(
				"Webhook error:",
				validationError,
			);
			expect(response.status).toBe(400);
			expect(responseData).toEqual({
				error: "Validation failed",
				details: "Invalid payload",
			});
		});

		it("returns 401 when FeatureFlagWebhookAuthenticationError occurs", async () => {
			const authError = new FeatureFlagWebhookAuthenticationError(
				"Invalid token",
			);
			mockFeatureFlagWebhook.mockRejectedValue(authError);

			const request = new NextRequest(
				"https://example.com/api/feature-flag-webhook",
			);
			const response = await POST(request);
			const responseData = await response.json();

			expect(mockLogger.error).toHaveBeenCalledWith(
				"Webhook error:",
				authError,
			);
			expect(response.status).toBe(401);
			expect(responseData).toEqual({
				error: "Authentication failed",
				details: "Invalid token",
			});
		});

		it("returns 500 when unknown error occurs", async () => {
			const unknownError = new Error("Something went wrong");
			mockFeatureFlagWebhook.mockRejectedValue(unknownError);

			const request = new NextRequest(
				"https://example.com/api/feature-flag-webhook",
			);
			const response = await POST(request);
			const responseData = await response.json();

			expect(mockLogger.error).toHaveBeenCalledWith(
				"Webhook error:",
				unknownError,
			);
			expect(response.status).toBe(500);
			expect(responseData).toEqual({
				error: "Internal server error",
			});
		});
	});

	describe("GET", () => {
		it("returns health check response", async () => {
			const response = await GET();
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData.message).toBe(
				"Feature flag webhook endpoint is healthy",
			);
			expect(responseData.timestamp).toBeDefined();
			expect(new Date(responseData.timestamp).getTime()).toBeGreaterThan(0);
		});
	});
});
