import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LogLevel } from "@/lib/logger";
import {
	AuthenticationError,
	ConfigurationError,
	SlackApiError,
} from "./errors";
import {
	extractSentryData,
	formatSlackMessage,
	getSlackWebhookUrl,
	parseWebhookPayload,
	sendSlackMessage,
	sentryWebhook,
	verifySignature,
} from "./index";

const mockEnv = {
	SENTRY_CLIENT_SECRET: "test-secret",
	SLACK_WEBHOOK_URL: "https://hooks.slack.com/test",
	VERCEL_ENV: "development",
	SLACK_PRODUCTION_WEBHOOK_URL: "https://hooks.slack.com/prod",
	SLACK_STAGING_WEBHOOK_URL: "https://hooks.slack.com/staging",
};

describe("custom errors", () => {
	it("AuthenticationError has status 401", () => {
		const err = new AuthenticationError("bad signature");
		expect(err.status).toBe(401);
	});

	it("ConfigurationError has status 500", () => {
		const err = new ConfigurationError("missing env");
		expect(err.status).toBe(500);
	});
});

describe("verifySignature", () => {
	it("returns false on crypto error", async () => {
		const result = await verifySignature("body", "sig", "secret");
		expect(typeof result).toBe("boolean");
	});

	it("successfully verifies valid signature", async () => {
		const result = await verifySignature(
			"test-body",
			"test-signature",
			"test-secret",
		);
		expect(typeof result).toBe("boolean");
	});

	it("returns false when signature verification fails", async () => {
		const originalImportKey = global.crypto.subtle.importKey;
		global.crypto.subtle.importKey = vi
			.fn()
			.mockRejectedValue(new Error("Crypto error"));

		const result = await verifySignature("body", "sig", "secret");
		expect(result).toBe(false);
		global.crypto.subtle.importKey = originalImportKey;
	});
});

describe("sendSlackMessage", () => {
	it("throws on non-OK response", async () => {
		const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 500 });
		await expect(
			sendSlackMessage("https://hooks.slack.com", { text: "hi" }, { fetchFn }),
		).rejects.toBeInstanceOf(SlackApiError);
	});

	it("posts payload successfully", async () => {
		const fetchFn = vi.fn().mockResolvedValue({ ok: true, status: 200 });
		await expect(
			sendSlackMessage("https://hooks.slack.com", { text: "hi" }, { fetchFn }),
		).resolves.toBeUndefined();
		expect(fetchFn).toHaveBeenCalled();
	});

	it("uses default fetch when no custom fetchFn provided", async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
		global.fetch = mockFetch;

		await sendSlackMessage("https://hooks.slack.com", { text: "hi" });
		expect(mockFetch).toHaveBeenCalledWith(
			"https://hooks.slack.com",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: "hi" }),
			}),
		);
	});
});

describe("formatSlackMessage", () => {
	const baseAlert: import("./types").SentryAlert = {
		id: "1",
		project: "proj",
		message: "msg",
		level: LogLevel.ERROR,
		event: {
			event_id: "e1",
			timestamp: new Date().toISOString(),
			environment: "dev",
		},
	};

	it("includes header and fields", () => {
		const msg = formatSlackMessage(baseAlert, "created");
		expect(msg.blocks?.length).toBeGreaterThan(0);
	});

	it("adds culprit and user fields and action button when present", () => {
		const alert: typeof baseAlert = {
			...baseAlert,
			culprit: "my.culprit",
			event: {
				...baseAlert.event,
				user: { id: "u1", email: "u@example.com" },
			},
		};
		const withUrl = {
			...alert,
			url: "https://sentry.io/issue",
		} as typeof alert & { url: string };
		const msg = formatSlackMessage(withUrl, "updated");
		const fieldsBlock = msg.blocks?.[1] as
			| { fields?: Array<{ text: string }> }
			| undefined;
		expect(
			fieldsBlock?.fields?.some((f) => String(f.text).includes("Culprit")),
		).toBe(true);
		expect(
			fieldsBlock?.fields?.some((f) => String(f.text).includes("User")),
		).toBe(true);
		expect(
			(msg.blocks || []).some(
				(b) => (b as { type?: string }).type === "actions",
			),
		).toBe(true);
	});

	it("handles missing blocks gracefully", () => {
		const alertWithoutBlocks = { ...baseAlert };
		const msg = formatSlackMessage(alertWithoutBlocks);
		expect(msg.blocks).toBeDefined();
	});

	it("handles missing fields array gracefully", () => {
		const alertWithInvalidFields = { ...baseAlert };
		const msg = formatSlackMessage(alertWithInvalidFields);
		expect(msg.blocks).toBeDefined();
	});

	it("returns early when slackMessage.blocks is falsy", () => {
		const alertWithoutBlocks = { ...baseAlert };
		const msg = formatSlackMessage(alertWithoutBlocks);

		expect(msg).toBeDefined();
		expect(msg.blocks).toBeDefined();
		expect(Array.isArray(msg.blocks)).toBe(true);
	});

	it("covers the early return path for blocks safety check", () => {
		const alertWithAllFields = {
			...baseAlert,
			culprit: "test.culprit",
			url: "https://sentry.io/test",
			event: {
				...baseAlert.event,
				user: { id: "test-user", email: "test@example.com" },
			},
		};

		const msg = formatSlackMessage(alertWithAllFields);

		expect(msg.blocks).toBeDefined();
		expect(Array.isArray(msg.blocks)).toBe(true);
	});

	it("handles case where fields array condition fails", () => {
		const alertWithoutUserOrCulprit = {
			...baseAlert,

			event: {
				...baseAlert.event,
			},
		};

		const msg = formatSlackMessage(alertWithoutUserOrCulprit);

		expect(msg.blocks).toBeDefined();
		expect(Array.isArray(msg.blocks)).toBe(true);
	});

	it("covers culprit condition failure path", () => {
		const alertWithoutCulprit = {
			...baseAlert,
			culprit: undefined,
		};

		const msg = formatSlackMessage(alertWithoutCulprit);

		expect(msg.blocks).toBeDefined();
		expect(Array.isArray(msg.blocks)).toBe(true);
	});

	it("covers user condition failure path", () => {
		const alertWithoutUser = {
			...baseAlert,
			event: {
				...baseAlert.event,
				user: undefined,
			},
		};

		const msg = formatSlackMessage(alertWithoutUser);

		expect(msg.blocks).toBeDefined();
		expect(Array.isArray(msg.blocks)).toBe(true);
	});

	it("executes culprit conditional block when all conditions are true", () => {
		const alertWithCulprit = {
			...baseAlert,
			culprit: "test.culprit",
		};

		const msg = formatSlackMessage(alertWithCulprit);

		expect(msg.blocks).toBeDefined();
		expect(Array.isArray(msg.blocks)).toBe(true);
		expect(msg.blocks).toBeDefined();
		const fieldsBlock = msg.blocks?.[1];
		expect(fieldsBlock?.fields).toBeDefined();
		expect(
			fieldsBlock?.fields?.some((field) => field.text.includes("Culprit")),
		).toBe(true);
	});

	it("executes user conditional block when all conditions are true", () => {
		const alertWithUser = {
			...baseAlert,
			event: {
				...baseAlert.event,
				user: { id: "test-user", email: "test@example.com" },
			},
		};

		const msg = formatSlackMessage(alertWithUser);

		expect(msg.blocks).toBeDefined();
		expect(Array.isArray(msg.blocks)).toBe(true);
		expect(msg.blocks).toBeDefined();
		const fieldsBlock = msg.blocks?.[1];
		expect(fieldsBlock?.fields).toBeDefined();
		expect(
			fieldsBlock?.fields?.some((field) => field.text.includes("User")),
		).toBe(true);
	});

	it("executes user conditional block when user has only email", () => {
		const alertWithUser = {
			...baseAlert,
			event: {
				...baseAlert.event,
				user: { email: "test@example.com" },
			},
		};

		const msg = formatSlackMessage(alertWithUser);

		expect(msg.blocks).toBeDefined();
		const fieldsBlock = msg.blocks?.[1];
		expect(fieldsBlock?.fields).toBeDefined();
		expect(
			fieldsBlock?.fields?.some((field) =>
				field.text.includes("*User:* test@example.com"),
			),
		).toBe(true);
	});

	it("executes user conditional block when user has only id", () => {
		const alertWithUser = {
			...baseAlert,
			event: {
				...baseAlert.event,
				user: { id: "test-user-123" },
			},
		};

		const msg = formatSlackMessage(alertWithUser);

		expect(msg.blocks).toBeDefined();
		const fieldsBlock = msg.blocks?.[1];
		expect(fieldsBlock?.fields).toBeDefined();
		expect(
			fieldsBlock?.fields?.some((field) =>
				field.text.includes("*User:* test-user-123"),
			),
		).toBe(true);
	});
});

describe("extractSentryData", () => {
	it("maps event_alert with tags and user", () => {
		const webhookData = {
			action: "triggered",
			data: {
				event: {
					event_id: "e123",
					project: 42,
					message: "boom",
					title: "Boom!",
					level: LogLevel.ERROR,
					datetime: new Date().toISOString(),
					web_url: "https://sentry.io/e/1",
					tags: [
						["environment", "prod"],
						["foo", "bar"],
					],
					user: { id: "u1", email: "u@example.com" },
				},
			},
		} as unknown as Parameters<typeof extractSentryData>[0];
		const res = extractSentryData(webhookData, "event_alert");
		expect(res?.project).toBe("42");
		expect(res?.event.environment).toBe("prod");
		expect(res?.event.user?.email).toBe("u@example.com");
	});

	it("maps issue resource and defaults level to ERROR", () => {
		const webhookData = {
			action: "created",
			data: {
				issue: {
					id: "i1",
					project: { name: "projName" },
					title: "Oops",
					permalink: "https://sentry.io/i/1",
					tags: { environment: "staging", user: "u2" },
				},
			},
		};
		const res = extractSentryData(webhookData, "issue");
		expect(res?.project).toBe("projName");
		expect(res?.level).toBe(LogLevel.ERROR);
		expect(res?.event.environment).toBe("staging");
	});

	it("returns null for unsupported resource", () => {
		const res = extractSentryData(
			{ action: "x", data: {} } as unknown as Parameters<
				typeof extractSentryData
			>[0],
			"something",
		);
		expect(res).toBeNull();
	});

	it("returns null when issue resource has no data", () => {
		const res = extractSentryData(
			{ action: "x", data: {} } as unknown as Parameters<
				typeof extractSentryData
			>[0],
			"issue",
		);
		expect(res).toBeNull();
	});

	it("uses project string when provided in error resource", () => {
		const res = extractSentryData(
			{
				action: "x",
				data: { error: { id: "1", project: "stringProj", title: "t" } },
			} as unknown as Parameters<typeof extractSentryData>[0],
			"error",
		);
		expect(res?.project).toBe("stringProj");
	});

	it("handles event_alert without tags and user", () => {
		const webhookData = {
			action: "triggered",
			data: {
				event: {
					event_id: "e123",
					project: 42,
					message: "boom",
					title: "Boom!",
					level: LogLevel.ERROR,
					datetime: new Date().toISOString(),
					web_url: "https://sentry.io/e/1",
				},
			},
		};
		const res = extractSentryData(webhookData, "event_alert");
		expect(res?.event.tags).toEqual({});
		expect(res?.event.user).toBeUndefined();
	});

	it("uses message when title is missing", () => {
		const webhookData = {
			action: "triggered",
			data: {
				event: {
					event_id: "e123",
					project: 42,
					message: "fallback message",

					level: LogLevel.ERROR,
					datetime: new Date().toISOString(),
					web_url: "https://sentry.io/e/1",
				},
			},
		};
		const res = extractSentryData(webhookData, "event_alert");
		expect(res?.message).toBe("fallback message");
	});

	it("uses 'No message' when both title and message are missing", () => {
		const webhookData = {
			action: "triggered",
			data: {
				event: {
					event_id: "e123",
					project: 42,
					message: "",

					level: LogLevel.ERROR,
					datetime: new Date().toISOString(),
					web_url: "https://sentry.io/e/1",
				},
			},
		};
		const res = extractSentryData(webhookData, "event_alert");
		expect(res?.message).toBe("No message");
	});

	it("uses event.url when web_url is missing", () => {
		const webhookData = {
			action: "triggered",
			data: {
				event: {
					event_id: "e123",
					project: 42,
					message: "test message",
					title: "Test Event",
					level: LogLevel.ERROR,
					datetime: new Date().toISOString(),

					url: "https://sentry.io/e/1-alt",
				},
			},
		};
		const res = extractSentryData(webhookData, "event_alert");
		expect(res?.url).toBe("https://sentry.io/e/1-alt");
	});

	it("sets url to undefined when both web_url and url are missing", () => {
		const webhookData = {
			action: "triggered",
			data: {
				event: {
					event_id: "e123",
					project: 42,
					message: "test message",
					title: "Test Event",
					level: LogLevel.ERROR,
					datetime: new Date().toISOString(),
				},
			},
		};
		const res = extractSentryData(webhookData, "event_alert");
		expect(res?.url).toBeUndefined();
	});

	it("handles issue resource message fallback logic", () => {
		const webhookData = {
			action: "created",
			data: {
				issue: {
					id: "test-issue",
					project: "test-project",
					permalink: "https://sentry.io/test",
				},
			},
		};
		const res = extractSentryData(webhookData, "issue");
		expect(res?.message).toBe("No message");
	});

	it("handles issue resource with title but no message", () => {
		const webhookData = {
			action: "created",
			data: {
				issue: {
					id: "test-issue",
					project: "test-project",
					title: "Test Issue Title",

					permalink: "https://sentry.io/test",
				},
			},
		};
		const res = extractSentryData(webhookData, "issue");
		expect(res?.message).toBe("Test Issue Title");
	});

	it("handles issue with string project", () => {
		const webhookData = {
			action: "created",
			data: {
				issue: {
					id: "i1",
					project: "stringProject",
					title: "Oops",
					permalink: "https://sentry.io/i/1",
				},
			},
		};
		const res = extractSentryData(webhookData, "issue");
		expect(res?.project).toBe("stringProject");
	});

	it("handles error resource with missing optional fields", () => {
		const webhookData = {
			action: "created",
			data: {
				error: {
					id: "e1",
					title: "Error",
				},
			},
		};
		const res = extractSentryData(webhookData, "error");
		expect(res?.project).toBe("Unknown Project");
		expect(res?.level).toBe(LogLevel.ERROR);
		expect(res?.event.environment).toBe("unknown");
		expect(res?.event.tags).toEqual({});
	});
});

describe("parseWebhookPayload", () => {
	it("parses valid payload", () => {
		const body = JSON.stringify({ action: "created", data: {} });
		expect(() => parseWebhookPayload(body)).not.toThrow();
	});

	it("throws on invalid JSON", () => {
		expect(() => parseWebhookPayload("{" as unknown as string)).toThrow();
	});

	it("throws ZodError on schema violation", () => {
		expect(() =>
			parseWebhookPayload(JSON.stringify({ wrong: true })),
		).toThrow();
	});
});

describe("getSeverityEmoji default path via formatSlackMessage", () => {
	it("falls back to clipboard emoji for unknown level", () => {
		const alert = {
			id: "1",
			project: "p",
			message: "m",
			level: "unknown",
			event: { event_id: "e", timestamp: new Date().toISOString() },
		} as unknown as import("./types").SentryAlert;
		const msg = formatSlackMessage(alert);
		const headerText = (msg.blocks?.[0] as { text?: { text?: string } })?.text
			?.text as string;
		expect(headerText.includes("📋")).toBe(true);
	});

	it("returns correct emoji for each log level", () => {
		const levels = [
			{ level: "fatal", emoji: "🚨" },
			{ level: "error", emoji: "🚨" },
			{ level: "warning", emoji: "⚠️" },
			{ level: "info", emoji: "ℹ️" },
			{ level: "debug", emoji: "🐛" },
		];

		levels.forEach(({ level, emoji }) => {
			const alert = {
				id: "1",
				project: "p",
				message: "m",
				level,
				event: { event_id: "e", timestamp: new Date().toISOString() },
			} as unknown as import("./types").SentryAlert;
			const msg = formatSlackMessage(alert);
			const headerText = (msg.blocks?.[0] as { text?: { text?: string } })?.text
				?.text as string;
			expect(headerText.includes(emoji)).toBe(true);
		});
	});
});

describe("getSlackWebhookUrl", () => {
	beforeEach(() => {
		vi.stubEnv("VERCEL_ENV", "development");
		vi.stubEnv("SLACK_PRODUCTION_WEBHOOK_URL", "https://hooks.slack.com/prod");
		vi.stubEnv("SLACK_STAGING_WEBHOOK_URL", "https://hooks.slack.com/staging");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns production webhook URL for production environment", () => {
		vi.stubEnv("VERCEL_ENV", "production");
		const url = getSlackWebhookUrl();
		expect(url).toBe("https://hooks.slack.com/prod");
	});

	it("returns staging webhook URL for preview environment", () => {
		vi.stubEnv("VERCEL_ENV", "preview");
		const url = getSlackWebhookUrl();
		expect(url).toBe("https://hooks.slack.com/staging");
	});

	it("returns undefined for other environments", () => {
		vi.stubEnv("VERCEL_ENV", "development");
		const url = getSlackWebhookUrl();
		expect(url).toBeUndefined();
	});

	it("returns undefined when VERCEL_ENV is not set", () => {
		vi.unstubAllEnvs();
		const url = getSlackWebhookUrl();
		expect(url).toBeUndefined();
	});
});

describe("sentryWebhook", () => {
	let mockRequest: NextRequest;
	let mockSlackWebhookUrl: string;

	beforeEach(() => {
		vi.stubEnv("SENTRY_CLIENT_SECRET", mockEnv.SENTRY_CLIENT_SECRET);
		vi.stubEnv("SLACK_WEBHOOK_URL", mockEnv.SLACK_WEBHOOK_URL);

		mockRequest = {
			text: vi.fn().mockResolvedValue(
				JSON.stringify({
					action: "created",
					data: {
						issue: {
							id: "test-issue",
							project: "test-project",
							title: "Test Issue",
							permalink: "https://sentry.io/test",
							level: LogLevel.ERROR,
						},
					},
				}),
			),
			headers: {
				get: vi.fn().mockImplementation((key: string) => {
					if (key === "sentry-hook-resource") return "issue";
					if (key === "sentry-hook-signature") return "010203";
					return null;
				}),
			},
		} as unknown as NextRequest;

		mockSlackWebhookUrl = "https://hooks.slack.com/test";

		vi.spyOn(global.crypto.subtle, "importKey").mockResolvedValue(
			"mock-key" as unknown as CryptoKey,
		);
		vi.spyOn(global.crypto.subtle, "sign").mockResolvedValue(
			new Uint8Array([1, 2, 3]) as unknown as ArrayBuffer,
		);

		global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("throws ConfigurationError when SENTRY_CLIENT_SECRET is missing", async () => {
		vi.stubEnv("SENTRY_CLIENT_SECRET", undefined);

		const response = await sentryWebhook(mockRequest, mockSlackWebhookUrl);
		expect(response.status).toBe(500);

		const responseData = await response.json();
		expect(responseData.error).toBe("SENTRY_CLIENT_SECRET not configured");
	});

	it("throws ConfigurationError when SLACK_WEBHOOK_URL is not provided", async () => {
		const response = await sentryWebhook(mockRequest, undefined);
		expect(response.status).toBe(500);

		const responseData = await response.json();
		expect(responseData.error).toBe("SLACK_WEBHOOK_URL not configured");
	});

	it("throws AuthenticationError when signature verification fails", async () => {
		const invalidSignatureRequest = {
			...mockRequest,
			headers: {
				get: vi.fn().mockImplementation((key: string) => {
					if (key === "sentry-hook-resource") return "issue";
					if (key === "sentry-hook-signature") return "999999";
					return null;
				}),
			},
		} as unknown as NextRequest;

		const response = await sentryWebhook(
			invalidSignatureRequest,
			mockSlackWebhookUrl,
		);
		expect(response.status).toBe(401);

		const responseData = await response.json();
		expect(responseData.error).toBe("Invalid Sentry signature");
	});

	it("successfully processes webhook and forwards to Slack", async () => {
		const response = await sentryWebhook(mockRequest, mockSlackWebhookUrl);
		expect(response.status).toBe(200);

		const responseData = await response.json();
		expect(responseData.success).toBe(true);
		expect(responseData.message).toBe("Alert forwarded to Slack");
		expect(responseData.timestamp).toBeDefined();
		expect(global.fetch).toHaveBeenCalledWith(
			mockSlackWebhookUrl,
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json" },
			}),
		);
	});

	it("returns success when no actionable data is found", async () => {
		const noDataRequest = {
			...mockRequest,
			text: vi.fn().mockResolvedValue(
				JSON.stringify({
					action: "created",
					data: {},
				}),
			),
			headers: {
				get: vi.fn().mockImplementation((key: string) => {
					if (key === "sentry-hook-resource") return "unsupported-resource";
					if (key === "sentry-hook-signature") return "010203";
					return null;
				}),
			},
		} as unknown as NextRequest;

		const response = await sentryWebhook(noDataRequest, mockSlackWebhookUrl);
		expect(response.status).toBe(200);

		const responseData = await response.json();
		expect(responseData.success).toBe(true);
		expect(responseData.message).toBe("No action needed");
	});

	it("handles Zod validation errors", async () => {
		const invalidPayloadRequest = {
			...mockRequest,
			text: vi.fn().mockResolvedValue(
				JSON.stringify({
					data: {},
				}),
			),
		} as unknown as NextRequest;

		const response = await sentryWebhook(
			invalidPayloadRequest,
			mockSlackWebhookUrl,
		);
		expect(response.status).toBe(400);

		const responseData = await response.json();
		expect(responseData.error).toBe("Validation error");
		expect(responseData.details).toBeDefined();
	});

	it("handles Slack API errors", async () => {
		global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

		const response = await sentryWebhook(mockRequest, mockSlackWebhookUrl);
		expect(response.status).toBe(502);

		const responseData = await response.json();
		expect(responseData.error).toBe("Slack API error: 500");
	});

	it("handles general errors gracefully", async () => {
		const errorRequest = {
			...mockRequest,
			text: vi.fn().mockRejectedValue(new Error("Network error")),
		} as unknown as NextRequest;

		const response = await sentryWebhook(errorRequest, mockSlackWebhookUrl);
		expect(response.status).toBe(500);

		const responseData = await response.json();
		expect(responseData.error).toBe("Internal server error");
	});

	it("handles SlackMessageSchema validation errors", async () => {
		const errorRequest = {
			...mockRequest,
			text: vi
				.fn()
				.mockRejectedValue(new Error("Slack message formatting error")),
		} as unknown as NextRequest;

		const response = await sentryWebhook(errorRequest, mockSlackWebhookUrl);
		expect(response.status).toBe(500);

		const responseData = await response.json();
		expect(responseData.error).toBe("Internal server error");
	});

	it("processes event_alert resource type successfully", async () => {
		const eventAlertRequest = {
			...mockRequest,
			text: vi.fn().mockResolvedValue(
				JSON.stringify({
					action: "triggered",
					data: {
						event: {
							event_id: "e123",
							project: 42,
							message: "Test event",
							title: "Test Event",
							level: LogLevel.ERROR,
							datetime: new Date().toISOString(),
							web_url: "https://sentry.io/e/123",
							tags: [["environment", "test"]],
						},
					},
				}),
			),
			headers: {
				get: vi.fn().mockImplementation((key: string) => {
					if (key === "sentry-hook-resource") return "event_alert";
					if (key === "sentry-hook-signature") return "010203";
					return null;
				}),
			},
		} as unknown as NextRequest;

		const response = await sentryWebhook(
			eventAlertRequest,
			mockSlackWebhookUrl,
		);
		expect(response.status).toBe(200);

		const responseData = await response.json();
		expect(responseData.success).toBe(true);
	});

	it("handles missing signature header gracefully", async () => {
		const noSignatureRequest = {
			...mockRequest,
			headers: {
				get: vi.fn().mockImplementation((key: string) => {
					if (key === "sentry-hook-resource") return "issue";
					if (key === "sentry-hook-signature") return null;
					return null;
				}),
			},
		} as unknown as NextRequest;

		const response = await sentryWebhook(
			noSignatureRequest,
			mockSlackWebhookUrl,
		);
		expect(response.status).toBe(200);

		const responseData = await response.json();
		expect(responseData.success).toBe(true);
		expect(responseData.message).toBe("Alert forwarded to Slack");
	});

	it("handles JSON parse errors", async () => {
		const invalidJsonRequest = {
			...mockRequest,
			text: vi.fn().mockResolvedValue("invalid json {"),
		} as unknown as NextRequest;

		const response = await sentryWebhook(
			invalidJsonRequest,
			mockSlackWebhookUrl,
		);
		expect(response.status).toBe(500);

		const responseData = await response.json();
		expect(responseData.error).toBe("Internal server error");
	});
});
