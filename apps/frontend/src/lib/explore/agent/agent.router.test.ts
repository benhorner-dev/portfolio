import { beforeEach, describe, expect, it, vi } from "vitest";
import { OracleValues } from "@/lib/explore/constants";
import {
	AgentGraphError,
	TracedAgentGraphError,
	UnexpectedAgentGraphError,
} from "@/lib/explore/errors";
import type { AgentConfig, AgentState, ToolName } from "@/lib/explore/types";
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
			prompt: [],
			llm: mockLLM,
			answerFormatter: mockFormatter,
			tools: [],
		};
	}
}

describe("AgentOrchestrator router", () => {
	let config: AgentConfig;
	let orchestrator: any;

	beforeEach(async () => {
		config = {
			defaultAgentActionLog: "default log",
			tools: [],
			llms: [{ provider: "openai", providerArgs: {} }],
			answerFormatters: [{ name: "default" }],
			systemPrompt: "test prompt",
			maxIntermediateSteps: 2,
			defaultErrorMessage: "error",
		} as any as AgentConfig;

		orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
		);
		orchestrator.toolCallCount = 0;
	});

	it("should return final_answer when intermediate_steps is empty or not array", async () => {
		const mockState: AgentState = {
			intermediateSteps: [],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toBe(OracleValues.FINAL_ANSWER);
	});

	it("should return final_answer when no actions found in last step", async () => {
		const mockState: AgentState = {
			intermediateSteps: [{ actions: [], results: [] }],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toBe(OracleValues.FINAL_ANSWER);
	});

	it("should return single tool name when actions length is 1", async () => {
		const mockAction = { tool: "testTool", toolInput: {}, log: "test" };
		const mockState: AgentState = {
			intermediateSteps: [{ actions: [mockAction], results: ["result"] }],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toStrictEqual(["testTool"]);
		expect(orchestrator.toolCallCount).toBe(1);
	});

	it("should return array of tool names when actions length is greater than 1 and no final_answer", async () => {
		const mockAction1 = { tool: "testTool1", toolInput: {}, log: "test1" };
		const mockAction2 = { tool: "testTool2", toolInput: {}, log: "test2" };
		const mockState: AgentState = {
			intermediateSteps: [
				{
					actions: [mockAction1, mockAction2],
					results: ["result1", "result2"],
				},
			],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toEqual(["testTool1", "testTool2"]);
		expect(orchestrator.toolCallCount).toBe(2);
	});

	it("should return final_answer when final_answer is found in parallel execution", async () => {
		const mockAction1 = { tool: "testTool1", toolInput: {}, log: "test1" };
		const mockAction2 = {
			tool: OracleValues.FINAL_ANSWER,
			toolInput: {},
			log: "final",
		};
		const mockState: AgentState = {
			intermediateSteps: [
				{
					actions: [mockAction1, mockAction2],
					results: ["result1", "final_result"],
				},
			],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toBe(OracleValues.FINAL_ANSWER);
	});

	it("should return last tool when intermediate steps exist within limit", () => {
		const mockState: AgentState = {
			input: "test input",
			chatHistory: [],
			intermediateSteps: [
				{
					actions: [
						{ tool: "rag_search" as ToolName, toolInput: {}, log: "log1" },
					],
					results: [""],
				} as any,
				{
					actions: [
						{ tool: "final_answer" as ToolName, toolInput: {}, log: "log2" },
					],
					results: [""],
				},
			],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toBe("final_answer");
	});

	it("should return final_answer when intermediate steps is empty", () => {
		const mockState: AgentState = {
			input: "test input",
			chatHistory: [],
			intermediateSteps: [],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toBe("final_answer");
	});
});

describe("router", () => {
	let config: AgentConfig;
	let orchestrator: any;

	beforeEach(async () => {
		config = {
			defaultAgentActionLog: "default log",
			tools: [],
			llms: [{ provider: "openai", providerArgs: {} }],
			answerFormatters: [{ name: "default" }],
			systemPrompt: "test prompt",
			maxIntermediateSteps: 2,
			defaultErrorMessage: "error",
		} as any as AgentConfig;
		orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
		);
		orchestrator.toolCallCount = 0;
	});

	it("should return final_answer when intermediate_steps is empty or not array", async () => {
		const mockState: AgentState = {
			intermediateSteps: [],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toBe(OracleValues.FINAL_ANSWER);
	});

	it("should return final_answer when no actions found in last step", async () => {
		const mockState: AgentState = {
			intermediateSteps: [{ actions: [], results: [] }],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toBe(OracleValues.FINAL_ANSWER);
	});

	it("should return single tool name when actions length is 1", async () => {
		const mockAction = { tool: "testTool", toolInput: {}, log: "test" };
		const mockState: AgentState = {
			intermediateSteps: [{ actions: [mockAction], results: ["result"] }],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toStrictEqual(["testTool"]);
		expect(orchestrator.toolCallCount).toBe(1);
	});

	it("should return array of tool names when actions length is greater than 1 and no final_answer", async () => {
		const mockAction1 = { tool: "testTool1", toolInput: {}, log: "test1" };
		const mockAction2 = { tool: "testTool2", toolInput: {}, log: "test2" };
		const mockState: AgentState = {
			intermediateSteps: [
				{
					actions: [mockAction1, mockAction2],
					results: ["result1", "result2"],
				},
			],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toEqual(["testTool1", "testTool2"]);
		expect(orchestrator.toolCallCount).toBe(2);
	});

	it("should return final_answer when final_answer is found in parallel execution", async () => {
		const mockAction1 = { tool: "testTool1", toolInput: {}, log: "test1" };
		const mockAction2 = {
			tool: OracleValues.FINAL_ANSWER,
			toolInput: {},
			log: "final",
		};
		const mockState: AgentState = {
			intermediateSteps: [
				{
					actions: [mockAction1, mockAction2],
					results: ["result1", "final_result"],
				},
			],
		} as any;

		const result = orchestrator.router(mockState);

		expect(result).toBe(OracleValues.FINAL_ANSWER);
	});
});
