import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
	unstable_cache: vi.fn((fn) => fn),
}));

const { getAgentConfig } = await import("@/lib/explore/getAgentConfig");

describe("getAgentConfig", () => {
	const originalWindow = global.window;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		global.window = originalWindow;
	});

	it("should load and parse config successfully", async () => {
		const result = await getAgentConfig(
			"./src/test/fixtures/unitTestConfig.json",
		);

		expect(result.systemPrompt).toBe(
			"You are a test agent. Your task is to respond to the user's query with a simple echo of the input. Do not use any tools or perform any actions other than echoing the input back to the user.",
		);
	});

	it("should throw error when AGENT_CONFIG_PATH is not set", async () => {
		await expect(getAgentConfig(undefined)).rejects.toThrow(
			"an agent config path environment variable is not set",
		);
	});

	it("should throw error when config file loading fails", async () => {
		await expect(getAgentConfig("./nonexistent/config.json")).rejects.toThrow(
			"Failed to load agent config:",
		);
	});

	it("should throw error when config parsing fails", async () => {
		// Use a valid JSON file that fails schema validation to trigger parsing error
		await expect(
			getAgentConfig("./src/test/fixtures/invalidSchemaConfig.json"),
		).rejects.toThrow("Failed to parse agent config:");
	});

	// Note: Client-side protection is now handled by 'server-only' package at build time
	// rather than runtime, so these tests are no longer needed
});
