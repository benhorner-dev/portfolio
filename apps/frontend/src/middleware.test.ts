import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { middleware } from "./middleware";

vi.mock("./lib/identity/auth0", () => ({
	auth0: {
		middleware: vi.fn(),
	},
}));

describe("middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("x-middleware-subrequest header check", () => {
		it("returns 403 Forbidden when x-middleware-subrequest header is present on any route", async () => {
			const request = new NextRequest(
				"https://example.com/api/feature-flag-webhook",
			);
			request.headers.set("x-middleware-subrequest", "true");

			const response = await middleware(request);
			const responseData = await response.json();

			expect(response.status).toBe(403);
			expect(responseData).toEqual({ error: "Forbidden" });
		});

		it("returns 403 Forbidden when x-middleware-subrequest header is present on non-API route", async () => {
			const request = new NextRequest("https://example.com/dashboard");
			request.headers.set("x-middleware-subrequest", "true");

			const response = await middleware(request);
			const responseData = await response.json();

			expect(response.status).toBe(403);
			expect(responseData).toEqual({ error: "Forbidden" });
		});
	});

	describe("existing API routes", () => {
		it("returns response with security headers for feature-flag-webhook", async () => {
			const request = new NextRequest(
				"https://example.com/api/feature-flag-webhook",
			);
			const response = await middleware(request);

			expect(response.status).toBe(200);
			expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
			expect(response.headers.get("X-Frame-Options")).toBe("DENY");
			expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
			expect(response.headers.get("Referrer-Policy")).toBe(
				"strict-origin-when-cross-origin",
			);
			expect(response.headers.get("Strict-Transport-Security")).toBe(
				"max-age=31536000; includeSubDomains",
			);
		});

		it("returns response with security headers for sentry-webhook", async () => {
			const request = new NextRequest("https://example.com/api/sentry-webhook");
			const response = await middleware(request);

			expect(response.status).toBe(200);
			expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
			expect(response.headers.get("X-Frame-Options")).toBe("DENY");
			expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
			expect(response.headers.get("Referrer-Policy")).toBe(
				"strict-origin-when-cross-origin",
			);
			expect(response.headers.get("Strict-Transport-Security")).toBe(
				"max-age=31536000; includeSubDomains",
			);
		});
	});

	describe("other routes", () => {
		it("returns Auth0 response directly when Auth0 returns a response", async () => {
			const { auth0 } = await import("./lib/identity/auth0");
			const mockAuth0Response = NextResponse.redirect(
				"https://example.com/login",
			);
			vi.mocked(auth0.middleware).mockResolvedValue(mockAuth0Response);

			const request = new NextRequest("https://example.com/dashboard");
			const response = await middleware(request);

			expect(auth0.middleware).toHaveBeenCalledWith(request);
			expect(response).toBe(mockAuth0Response);
		});

		it("calls Auth0 middleware and applies security headers when Auth0 returns undefined", async () => {
			const { auth0 } = await import("./lib/identity/auth0");
			vi.mocked(auth0.middleware).mockResolvedValue(undefined as any);

			const request = new NextRequest("https://example.com/dashboard");
			const response = await middleware(request);

			expect(auth0.middleware).toHaveBeenCalledWith(request);
			expect(response.status).toBe(200);
			expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
			expect(response.headers.get("X-Frame-Options")).toBe("DENY");
			expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
			expect(response.headers.get("Referrer-Policy")).toBe(
				"strict-origin-when-cross-origin",
			);
			expect(response.headers.get("Strict-Transport-Security")).toBe(
				"max-age=31536000; includeSubDomains",
			);
		});
	});
});
