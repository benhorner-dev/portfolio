import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

describe("middleware", () => {
	it("returns response with security headers when x-middleware-subrequest header is not present", () => {
		const request = new NextRequest("https://example.com/api/test");
		const response = middleware(request);

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

	it("returns 403 Forbidden when x-middleware-subrequest header is present", async () => {
		const request = new NextRequest("https://example.com/api/test");
		request.headers.set("x-middleware-subrequest", "true");

		const response = middleware(request);
		const responseData = await response.json();

		expect(response.status).toBe(403);
		expect(responseData).toEqual({ error: "Forbidden" });
	});
});
