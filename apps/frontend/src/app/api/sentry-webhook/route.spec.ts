import type { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

describe("GET", () => {
	it("returns healthy status payload", async () => {
		const res = await GET();
		const json = await (res as Response).json();
		expect(json.message).toContain("healthy");
	});
});

describe("POST", () => {
	it("returns 500", async () => {
		vi.stubEnv("clientSecret", undefined);
		const res = POST({
			text: vi.fn(),
			headers: { get: vi.fn() },
		} as unknown as NextRequest);
		expect((await res).status).toBe(500);
	});
});
