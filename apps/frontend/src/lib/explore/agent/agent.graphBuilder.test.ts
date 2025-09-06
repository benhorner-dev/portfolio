import { ChatPromptTemplate } from "@langchain/core/prompts";
import { describe, expect, it, vi } from "vitest";
import {
	AgentGraphError,
	TracedAgentGraphError,
	UnexpectedAgentGraphError,
} from "@/lib/explore/errors";
import type { AgentConfig, Tool } from "@/lib/explore/types";
import { createAgentOrchestrator } from "./agent";

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

const mockLLM = () => "custom response";
const mockFormatter = () => "formatted response";
class MockGraphFactory {
	execute() {
		return {
			prompt: ChatPromptTemplate.fromMessages([
				["system", "test system prompt"],
				["user", ""],
				["assistant", ""],
			]),
			llm: mockLLM,
			answerFormatter: mockFormatter,
			tools: [],
		};
	}
}

describe("AgentOrchestrator graphBuilder", () => {
	it("should build a graph with the provided config, prompt, tools, llm and answer formatter", async () => {
		const config = {
			systemPrompt: "test system prompt",
			llms: [
				{
					provider: "mockLLM",
					providerArgs: {},
				},
			],
			tools: [],
			answerFormatters: [
				{
					name: "testFormatter",
				},
			],
		} as any as AgentConfig;

		const mockBoundLLM = {
			invoke: vi.fn().mockResolvedValue({ content: "test response" }),
			pipe: vi.fn(),
			stream: vi.fn(),
		};

		const mockLLM = {
			bindTools: vi.fn().mockReturnValue(mockBoundLLM),
		};

		const testTool = {} as Tool;
		const testFormatter = () => "formatted response";
		const maps = {
			toolMap: { testTool },
			llmMap: { mockLLM },
			formatterMap: { testFormatter },
		} as any;

		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
			maps,
		);

		const graph = orchestrator.graphBuilder();

		expect(graph).toBeDefined();
	});
});
