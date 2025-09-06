import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	AgentGraphError,
	TracedAgentGraphError,
	UnexpectedAgentGraphError,
} from "@/lib/explore/errors";
import type { AgentConfig, AgentState } from "@/lib/explore/types";
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

describe("AgentOrchestrator parallelTools", () => {
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

		orchestrator.toolMap = {
			testTool1: {},
			testTool2: {},
		};
	});

	it("should return updated state when parallel tools execute successfully", async () => {
		const mockAction1 = { tool: "testTool1", toolInput: {}, log: "test1" };
		const mockAction2 = { tool: "testTool2", toolInput: {}, log: "test2" };
		const mockState: AgentState = {
			intermediateSteps: [
				{
					actions: [{ tool: "testTool2" }],
					results: [""],
				},
			],
			usedTools: new Set(["existingTool"]),
			toolResults: { existingTool: "existing result" },
		} as any;

		orchestrator.getToolPromise = vi
			.fn()
			.mockResolvedValueOnce({
				success: true,
				action: mockAction1,
				result: "result1",
				tool: "testTool1",
			})
			.mockResolvedValueOnce({
				success: true,
				action: mockAction2,
				result: "result2",
				tool: "testTool2",
			});

		const result = await orchestrator.runTool(mockState, "testTool2");

		expect(result).toEqual({
			intermediateSteps: [
				{
					actions: [mockAction1],
					executionType: "sequential",
					results: ["result1"],
					timestamp: expect.any(Number),
				},
			] as any,
			usedTools: new Set(["existingTool", undefined]),
			toolResults: {
				existingTool: "existing result",
				undefined: "result1",
			},
		});
	});

	it("should throw AgentGraphError when tools are not found", async () => {
		const mockState: AgentState = {
			intermediateSteps: [
				{
					actions: [
						{
							tool: "missingTool1",
						},
					],
				},
			],
			usedTools: new Set(),
			toolResults: {},
		} as any;

		await expect(
			orchestrator.runTool(mockState, "missingTool1"),
		).rejects.toThrow(/^Error in runTool: Tools not found: missingTool1/);
	});
});
