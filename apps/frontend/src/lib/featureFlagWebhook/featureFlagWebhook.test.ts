import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	FeatureFlagWebhookAuthenticationError,
	FeatureFlagWebhookValidationError,
} from "./errors";

vi.mock("next/cache");
const mockInfo = vi.fn();
vi.mock("@/lib/logger", () => ({
	getLogger: vi.fn(() => ({
		info: mockInfo,
	})),
}));

const mockRevalidatePath = vi.mocked(revalidatePath);

describe("featureFlagWebhook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("verifySlackSignature", () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2023-01-01T00:00:00Z"));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("returns false for timestamp older than 5 minutes", async () => {
			const { verifySlackSignature } = await import("./featureFlagWebhook");
			const oldTimestamp = Math.floor(Date.now() / 1000) - 301;
			const result = await verifySlackSignature(
				"body",
				oldTimestamp.toString(),
				"signature",
				"secret",
			);
			expect(result).toBe(false);
		});

		it("returns false for timestamp newer than 5 minutes", async () => {
			const { verifySlackSignature } = await import("./featureFlagWebhook");
			const futureTimestamp = Math.floor(Date.now() / 1000) + 301;
			const result = await verifySlackSignature(
				"body",
				futureTimestamp.toString(),
				"signature",
				"secret",
			);
			expect(result).toBe(false);
		});

		it("returns false for signature with different length", async () => {
			const { verifySlackSignature } = await import("./featureFlagWebhook");
			const timestamp = Math.floor(Date.now() / 1000);
			const result = await verifySlackSignature(
				"body",
				timestamp.toString(),
				"short",
				"secret",
			);
			expect(result).toBe(false);
		});

		it("returns false for invalid signature", async () => {
			const { verifySlackSignature } = await import("./featureFlagWebhook");
			const timestamp = Math.floor(Date.now() / 1000);
			const result = await verifySlackSignature(
				"body",
				timestamp.toString(),
				"v0=invalid",
				"secret",
			);
			expect(result).toBe(false);
		});

		it("returns true for valid signature", async () => {
			const { verifySlackSignature } = await import("./featureFlagWebhook");
			const timestamp = Math.floor(Date.now() / 1000);
			const body = "test body";
			const baseString = `v0:${timestamp}:${body}`;
			const encoder = new TextEncoder();
			const key = await crypto.subtle.importKey(
				"raw",
				encoder.encode("secret"),
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"],
			);
			const signatureBuffer = await crypto.subtle.sign(
				"HMAC",
				key,
				encoder.encode(baseString),
			);
			const computedSignature = `v0=${Array.from(
				new Uint8Array(signatureBuffer),
			)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;

			const result = await verifySlackSignature(
				body,
				timestamp.toString(),
				computedSignature,
				"secret",
			);
			expect(result).toBe(true);
		});
	});

	describe("verifyHeaders", () => {
		it("returns timestamp and signature for valid headers", async () => {
			const { verifyHeaders } = await import("./featureFlagWebhook");
			const request = new NextRequest("https://example.com");
			request.headers.set("x-slack-request-timestamp", "1234567890");
			request.headers.set("x-slack-signature", "v0=abc123");

			const result = await verifyHeaders(request);

			expect(result).toEqual({
				timestamp: "1234567890",
				signature: "v0=abc123",
			});
		});

		it("throws validation error for missing timestamp header", async () => {
			const { verifyHeaders } = await import("./featureFlagWebhook");
			const request = new NextRequest("https://example.com");
			request.headers.set("x-slack-signature", "v0=abc123");

			await expect(verifyHeaders(request)).rejects.toThrow(
				FeatureFlagWebhookValidationError,
			);
		});

		it("throws validation error for missing signature header", async () => {
			const { verifyHeaders } = await import("./featureFlagWebhook");
			const request = new NextRequest("https://example.com");
			request.headers.set("x-slack-request-timestamp", "1234567890");

			await expect(verifyHeaders(request)).rejects.toThrow(
				FeatureFlagWebhookValidationError,
			);
		});

		it("throws validation error for null headers", async () => {
			const { verifyHeaders } = await import("./featureFlagWebhook");
			const request = new NextRequest("https://example.com");
			request.headers.delete("x-slack-request-timestamp");
			request.headers.delete("x-slack-signature");

			await expect(verifyHeaders(request)).rejects.toThrow(
				FeatureFlagWebhookValidationError,
			);
		});
	});

	describe("verifyBody", () => {
		it("returns url verification request", async () => {
			const { verifyBody } = await import("./featureFlagWebhook");
			const body = JSON.stringify({
				type: "url_verification",
				challenge: "test-challenge",
			});

			const result = await verifyBody(body);

			expect(result).toEqual({
				type: "url_verification",
				challenge: "test-challenge",
			});
		});

		it("throws validation error for invalid JSON", async () => {
			const { verifyBody } = await import("./featureFlagWebhook");
			const body = "invalid json";

			await expect(verifyBody(body)).rejects.toThrow(SyntaxError);
		});

		it("throws validation error for invalid request schema", async () => {
			const { verifyBody } = await import("./featureFlagWebhook");
			const body = JSON.stringify({
				type: "invalid_type",
				event: {
					type: "message",
					text: "Gate |test-gate> updated\nAuthor: test-user\nChanges: some changes",
					subtype: "bot_message",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});

			await expect(verifyBody(body)).rejects.toThrow(
				FeatureFlagWebhookValidationError,
			);
		});

		it("throws validation error for message without gate update pattern", async () => {
			const { verifyBody } = await import("./featureFlagWebhook");
			const body = JSON.stringify({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Just a regular message",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});

			await expect(verifyBody(body)).rejects.toThrow(
				FeatureFlagWebhookValidationError,
			);
		});

		it("throws validation error for message without gate name", async () => {
			const { verifyBody } = await import("./featureFlagWebhook");
			const body = JSON.stringify({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Gate updated\nAuthor: test-user\nChanges: some changes",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});

			await expect(verifyBody(body)).rejects.toThrow(
				FeatureFlagWebhookValidationError,
			);
		});

		it("throws validation error when both gate update pattern and gate name match fail", async () => {
			const { verifyBody } = await import("./featureFlagWebhook");
			const body = JSON.stringify({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Just a regular message without gate pattern or name",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});

			await expect(verifyBody(body)).rejects.toThrow(
				FeatureFlagWebhookValidationError,
			);
		});

		it("throws validation error when gate update pattern matches but gate name match fails", async () => {
			const { verifyBody } = await import("./featureFlagWebhook");
			const body = JSON.stringify({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Gate updated but no gate name in brackets",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});

			await expect(verifyBody(body)).rejects.toThrow(
				FeatureFlagWebhookValidationError,
			);
		});

		it("throws validation error when gate name match exists but gate update pattern fails", async () => {
			const { verifyBody } = await import("./featureFlagWebhook");
			const body = JSON.stringify({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Some other message with |test-gate> but not about gate updates",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});

			await expect(verifyBody(body)).rejects.toThrow(
				FeatureFlagWebhookValidationError,
			);
		});

		it("returns validated request for valid gate update and logs info", async () => {
			const { verifyBody } = await import("./featureFlagWebhook");
			const body = JSON.stringify({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Gate |test-gate> updated\nAuthor: test-user\nChanges: some changes",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});

			const result = await verifyBody(body);

			expect(result).toEqual({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Gate |test-gate> updated\nAuthor: test-user\nChanges: some changes",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});
			expect(mockInfo).toHaveBeenCalledWith("Statsig Gate update detected:", {
				gateName: "test-gate",
				author: "test-user\nChanges: some changes",
				changes: "Changes: some changes",
				botId: "B123",
				channel: "C123",
				timestamp: "1234567890.123",
			});
		});

		it("handles gate update with multiple lines of changes", async () => {
			const { verifyBody } = await import("./featureFlagWebhook");
			const body = JSON.stringify({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Gate |test-gate> updated\nAuthor: test-user\nChanges: line1\nline2\nline3",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});

			const result = await verifyBody(body);

			expect(result).toEqual({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Gate |test-gate> updated\nAuthor: test-user\nChanges: line1\nline2\nline3",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});
			expect(mockInfo).toHaveBeenCalledWith("Statsig Gate update detected:", {
				gateName: "test-gate",
				author: "test-user\nChanges: line1\nline2\nline3",
				changes: "Changes: line1\nline2\nline3",
				botId: "B123",
				channel: "C123",
				timestamp: "1234567890.123",
			});
		});

		it("handles gate update without author", async () => {
			const { verifyBody } = await import("./featureFlagWebhook");
			const body = JSON.stringify({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Gate |test-gate> updated\nChanges: some changes",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});

			const result = await verifyBody(body);

			expect(result).toEqual({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Gate |test-gate> updated\nChanges: some changes",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});
			expect(mockInfo).toHaveBeenCalledWith("Statsig Gate update detected:", {
				gateName: "test-gate",
				author: undefined,
				changes: "",
				botId: "B123",
				channel: "C123",
				timestamp: "1234567890.123",
			});
		});
	});

	describe("featureFlagWebhook", () => {
		beforeEach(() => {
			process.env.SLACK_SIGNING_SECRET = "test-secret";
		});

		afterEach(() => {
			delete process.env.SLACK_SIGNING_SECRET;
		});

		it("throws authentication error for invalid signature", async () => {
			const { featureFlagWebhook } = await import("./featureFlagWebhook");
			const request = new NextRequest("https://example.com");
			request.headers.set(
				"x-slack-request-timestamp",
				Math.floor(Date.now() / 1000).toString(),
			);
			request.headers.set("x-slack-signature", "v0=wrong-signature");

			const body = "test body";
			vi.spyOn(request, "text").mockResolvedValue(body);

			await expect(featureFlagWebhook(request)).rejects.toThrow(
				FeatureFlagWebhookAuthenticationError,
			);
		});

		it("throws validation error for missing environment variable", async () => {
			const { featureFlagWebhook } = await import("./featureFlagWebhook");
			delete process.env.SLACK_SIGNING_SECRET;

			const request = new NextRequest("https://example.com");

			await expect(featureFlagWebhook(request)).rejects.toThrow();
		});

		it("returns challenge for url verification", async () => {
			const { featureFlagWebhook } = await import("./featureFlagWebhook");
			const request = new NextRequest("https://example.com");
			const timestamp = Math.floor(Date.now() / 1000).toString();
			request.headers.set("x-slack-request-timestamp", timestamp);

			const body = JSON.stringify({
				type: "url_verification",
				challenge: "test-challenge",
			});

			const baseString = `v0:${timestamp}:${body}`;
			const encoder = new TextEncoder();
			const key = await crypto.subtle.importKey(
				"raw",
				encoder.encode("test-secret"),
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"],
			);
			const signatureBuffer = await crypto.subtle.sign(
				"HMAC",
				key,
				encoder.encode(baseString),
			);
			const computedSignature = `v0=${Array.from(
				new Uint8Array(signatureBuffer),
			)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;

			request.headers.set("x-slack-signature", computedSignature);
			vi.spyOn(request, "text").mockResolvedValue(body);

			const response = await featureFlagWebhook(request);
			const responseData = await response.json();

			expect(responseData).toEqual({ challenge: "test-challenge" });
		});

		it("returns ok for valid gate update", async () => {
			const { featureFlagWebhook } = await import("./featureFlagWebhook");
			const request = new NextRequest("https://example.com");
			const timestamp = Math.floor(Date.now() / 1000).toString();
			request.headers.set("x-slack-request-timestamp", timestamp);

			const body = JSON.stringify({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Gate |test-gate> updated\nAuthor: test-user\nChanges: some changes",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});

			const baseString = `v0:${timestamp}:${body}`;
			const encoder = new TextEncoder();
			const key = await crypto.subtle.importKey(
				"raw",
				encoder.encode("test-secret"),
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"],
			);
			const signatureBuffer = await crypto.subtle.sign(
				"HMAC",
				key,
				encoder.encode(baseString),
			);
			const computedSignature = `v0=${Array.from(
				new Uint8Array(signatureBuffer),
			)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;

			request.headers.set("x-slack-signature", computedSignature);
			vi.spyOn(request, "text").mockResolvedValue(body);

			const response = await featureFlagWebhook(request);
			const responseData = await response.json();

			expect(responseData).toEqual({ ok: true });
			expect(mockRevalidatePath).toHaveBeenCalledWith("/");
		});

		it("handles gate update without author and changes", async () => {
			const { featureFlagWebhook } = await import("./featureFlagWebhook");
			const request = new NextRequest("https://example.com");
			const timestamp = Math.floor(Date.now() / 1000).toString();
			request.headers.set("x-slack-request-timestamp", timestamp);

			const body = JSON.stringify({
				type: "event_callback",
				event: {
					type: "message",
					subtype: "bot_message",
					text: "Gate |test-gate> updated",
					bot_id: "B123",
					channel: "C123",
					ts: "1234567890.123",
				},
			});

			const baseString = `v0:${timestamp}:${body}`;
			const encoder = new TextEncoder();
			const key = await crypto.subtle.importKey(
				"raw",
				encoder.encode("test-secret"),
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"],
			);
			const signatureBuffer = await crypto.subtle.sign(
				"HMAC",
				key,
				encoder.encode(baseString),
			);
			const computedSignature = `v0=${Array.from(
				new Uint8Array(signatureBuffer),
			)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;

			request.headers.set("x-slack-signature", computedSignature);
			vi.spyOn(request, "text").mockResolvedValue(body);

			const response = await featureFlagWebhook(request);
			const responseData = await response.json();

			expect(responseData).toEqual({ ok: true });
			expect(mockRevalidatePath).toHaveBeenCalledWith("/");
		});
	});
});
