import { describe, expect, it, vi } from "vitest";
import {
	AgentGraphError,
	TracedAgentGraphError,
	UnexpectedAgentGraphError,
} from "@/lib/explore/errors";
import type { ChatMessage } from "../types";
import { formatChatHistory } from "./agent";

vi.mock("@/lib/logger", () => ({
	getLogger: () => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
	}),
}));

vi.mock("next/src/server/web/spec-extension/unstable-cache", () => ({
	unstable_cache: vi.fn((fn) => fn),
}));

vi.mock("@/lib/explore/maps", async () => {
	return {
		AGENT_ERRORS: {
			parentError: AgentGraphError,
			unExpectedError: UnexpectedAgentGraphError,
			tracedError: TracedAgentGraphError,
		},
		DEFAULT_TOOL_MAP: {},
		DETERMINISTIC_TOOL_MAP: {},
		TOOL_STATE_BINDINGS: {},
		DEFAULT_LLM_MAP: {},
		DEFAULT_FORMATTER_MAP: {},
	};
});
vi.mock("@ai-sdk/rsc", () => ({
	createStreamableValue: vi.fn((initialValue) => ({
		value: initialValue,
		update: vi.fn(),
		done: vi.fn(),
		append: vi.fn(),
	})),
}));

vi.mock("@/lib/explore/getAgentConfig/getAgentConfig", () => ({
	getAgentConfig: vi.fn().mockResolvedValue({
		name: "mock-config",
		llms: [],
		answerFormatters: [],
		tools: [{ name: "final_answer", description: "test" }],
	}),
}));

vi.mock("@/lib/ContentConfig/getContentConfig", () => ({
	getContentConfigForLocale: vi.fn().mockResolvedValue({
		chat: {
			defaultErrorMessage: "Test error message from config",
		},
	}),
}));

describe("formatChatHistory", () => {
	it("should format messages with timestamps", async () => {
		const messages = [
			{ type: "user", content: "Hello", timestamp: 1234567890000 },
			{ type: "assistant", content: "Hi there", timestamp: 1234567891000 },
		] as unknown as ChatMessage[];
		const result = await formatChatHistory(messages);
		expect(result).toContain("user: Hello");
		expect(result).toContain("assistant: Hi there");
		expect(result).toContain("[");
	});

	it("should format messages without timestamps", async () => {
		const messages = [
			{ type: "user", content: "Hello" },
			{ type: "assistant", content: "Hi there" },
		] as unknown as ChatMessage[];
		const result = await formatChatHistory(messages);
		expect(result).toBe("user: Hello\n\nassistant: Hi there");
	});

	it("should handle empty array", async () => {
		const result = await formatChatHistory([]);
		expect(result).toBe("");
	});

	it("should handle single message", async () => {
		const messages = [{ type: "user", content: "Test message" }] as any;
		const result = await formatChatHistory(messages);
		expect(result).toBe("user: Test message");
	});
});
