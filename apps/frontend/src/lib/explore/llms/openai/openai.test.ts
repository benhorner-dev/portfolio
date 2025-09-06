import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentGraphError } from "@/lib/explore/errors";
import { getOpenAiLLM } from "@/lib/explore/llms/openai";

vi.mock("@langchain/openai", () => ({
	ChatOpenAI: vi.fn(),
}));

describe("getOpenAiLLM", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.OPENAI_API_KEY = "test-api-key";
	});

	it("should throw AgentGraphError when temperature is less than 0", () => {
		const args = {
			model: "gpt-4",
			temperature: -0.1,
		};

		expect(() => getOpenAiLLM(args)).toThrow(AgentGraphError);
		expect(() => getOpenAiLLM(args)).toThrow(
			"Temperature must be between 0 and 1",
		);
	});

	it("should throw AgentGraphError when temperature is greater than 1", () => {
		const args = {
			model: "gpt-4",
			temperature: 1.1,
		};

		expect(() => getOpenAiLLM(args)).toThrow(AgentGraphError);
		expect(() => getOpenAiLLM(args)).toThrow(
			"Temperature must be between 0 and 1",
		);
	});

	it("should create and return ChatOpenAI instance with valid temperature", async () => {
		const { ChatOpenAI } = await import("@langchain/openai");
		const mockInstance = { model: "gpt-4", temperature: 0.7 };
		vi.mocked(ChatOpenAI).mockReturnValue(mockInstance as any);

		const args = {
			model: "gpt-4",
			temperature: 0.7,
		};

		const result = getOpenAiLLM(args);

		expect(ChatOpenAI).toHaveBeenCalledWith({
			model: "gpt-4",
			temperature: 0.7,
			apiKey: "test-api-key",
		});
		expect(result).toBe(mockInstance);
	});

	it("should work with temperature at boundary values", async () => {
		const { ChatOpenAI } = await import("@langchain/openai");
		const mockInstance = { model: "gpt-3.5-turbo" };
		vi.mocked(ChatOpenAI).mockReturnValue(mockInstance as any);

		expect(() =>
			getOpenAiLLM({ model: "gpt-3.5-turbo", temperature: 0 }),
		).not.toThrow();
		expect(() =>
			getOpenAiLLM({ model: "gpt-3.5-turbo", temperature: 1 }),
		).not.toThrow();
	});
});
