import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("AgentOrchestrator runTool", () => {
	let config: AgentConfig;
	let mockState: AgentState;

	beforeEach(async () => {
		config = {
			defaultAgentActionLog: "default log",
			tools: [],
			llms: [{ provider: "openai", providerArgs: {} }],
			answerFormatters: [{ name: "default" }],
			systemPrompt: "test prompt",
			maxIntermediateSteps: 10,
			defaultErrorMessage: "error",
		} as any as AgentConfig;

		mockState = {
			usedTools: [],
			input: "test input",
			chatHistory: [],
			intermediateSteps: [
				{
					actions: [
						{
							tool: "unknown_tool" as ToolName,
							toolInput: { query: "test" },
							log: "default log",
						},
					],
					results: [""],
				},
			],
		} as any;
	});

	it("should throw error when tool not found in toolMap", async () => {
		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
			{
				toolMap: {} as any,
			},
		);

		await expect(
			orchestrator.runTool(mockState, "unknown_tool"),
		).rejects.toThrow("Tools not found: unknown_tool");
	});

	it("should throw error when tool.invoke fails", async () => {
		const mockTool = {
			name: "failing_tool",
			invoke: vi.fn().mockRejectedValue(new Error("Tool invocation failed")),
		};

		mockState.intermediateSteps = [
			{
				actions: [
					{
						tool: "failing_tool" as ToolName,
						toolInput: { query: "test" } as any,
						log: "default log",
					},
				],
				results: [""],
			},
		] as any;

		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
			{
				toolMap: { failing_tool: mockTool } as any,
			},
		);

		await expect(
			orchestrator.runTool(mockState, "failing_tool"),
		).rejects.toThrow("Tool invocation failed");
	});

	it("should return intermediate_steps when tool invocation succeeds", async () => {
		const mockTool = {
			name: "success_tool",
			invoke: vi.fn().mockResolvedValue("tool output"),
		};

		mockState.intermediateSteps = [
			{
				actions: [
					{
						tool: "success_tool" as ToolName,
						toolInput: { query: "test" } as any,
						log: "default log",
					},
				],
				results: [""],
			},
		] as any;

		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
			{
				toolMap: { success_tool: mockTool } as any,
			},
		);

		const result = await orchestrator.runTool(mockState, "success_tool");

		expect(result.intermediateSteps).toEqual([
			{
				actions: [
					{
						tool: "success_tool",
						toolInput: { query: "test" },
						log: "tool output",
					},
				],
				executionType: "sequential",
				results: ["tool output"],
				timestamp: expect.any(Number),
			},
		]);
	});

	it("should return parallel type and both tool outputs", async () => {
		const mockTool = {
			name: "success_tool",
			invoke: vi.fn().mockResolvedValue("tool output"),
		};

		mockState.intermediateSteps = [
			{
				actions: [
					{
						tool: "success_tool" as ToolName,
						toolInput: { query: "test" } as any,
						log: "default log",
					},
					{
						tool: "success_tool" as ToolName,
						toolInput: { query: "test-2" } as any,
						log: "default log",
					},
				],
				results: ["", ""],
			},
		] as any;

		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
			{
				toolMap: { success_tool: mockTool } as any,
			},
		);

		const result = await orchestrator.runTool(mockState, "success_tool");

		expect(result.intermediateSteps).toEqual([
			{
				actions: [
					{
						tool: "success_tool",
						toolInput: { query: "test" },
						log: "tool output",
					},
					{
						tool: "success_tool",
						toolInput: { query: "test-2" },
						log: "tool output",
					},
				],
				executionType: "parallel",
				results: ["tool output", "tool output"],
				timestamp: expect.any(Number),
			},
		]);
	});
	it("should override tool args with default contextual input", async () => {
		const mockTool = {
			name: "success_tool",
			invoke: vi.fn().mockResolvedValue("tool output"),
		};

		mockState.intermediateSteps = [
			{
				actions: [
					{
						tool: "success_tool" as ToolName,
						toolInput: { query: "test" } as any,
						log: "default log",
					},
				],
				results: [""],
			},
		] as any;
		mockState.chatId = "12345";

		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
			{
				toolMap: { success_tool: mockTool } as any,
			},
			{ success_tool: { stateFields: ["chatId"] } },
		);

		const result = await orchestrator.runTool(mockState, "success_tool");

		expect(result.intermediateSteps).toEqual([
			{
				actions: [
					{
						tool: "success_tool",
						toolInput: { query: "test", chatId: "12345" },
						log: "tool output",
					},
				],
				executionType: "sequential",
				results: ["tool output"],
				timestamp: expect.any(Number),
			},
		]);
	});
	it("should throw error when no actions found for specified tool name", async () => {
		mockState.intermediateSteps = [
			{
				actions: [
					{
						tool: "different_tool" as ToolName,
						toolInput: { query: "test" } as any,
						log: "default log",
					},
				],
				results: [""],
			},
		] as any;

		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
			{
				toolMap: {
					different_tool: { name: "different_tool", invoke: vi.fn() },
					requested_tool: { name: "requested_tool", invoke: vi.fn() },
				} as any,
			},
		);

		await expect(
			orchestrator.runTool(mockState, "requested_tool"),
		).rejects.toThrow("No actions found for tool: requested_tool");
	});

	it("should throw error when no actions found in runTool (empty actions array)", async () => {
		// Set up a state where the last step has an empty actions array
		mockState.intermediateSteps = [
			{
				actions: [], // Empty actions array
				results: [""],
			},
		] as any;

		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
			{
				toolMap: {} as any,
			},
		);

		await expect(orchestrator.runTool(mockState, "any_tool")).rejects.toThrow(
			"No actions found in runTool",
		);
	});

	it("should throw error when no actions found in runTool (no actions property)", async () => {
		mockState.intermediateSteps = [
			{
				results: [""],
			},
		] as any;

		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
			{
				toolMap: {} as any,
			},
		);

		await expect(orchestrator.runTool(mockState, "any_tool")).rejects.toThrow(
			"No actions found in runTool",
		);
	});

	it("should throw error when no actions found for specified tool name", async () => {
		mockState.intermediateSteps = [
			{
				actions: [
					{
						tool: "different_tool" as ToolName,
						toolInput: { query: "test" } as any,
						log: "default log",
					},
				],
				results: [""],
			},
		] as any;

		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
			{
				toolMap: {
					different_tool: { name: "different_tool", invoke: vi.fn() },
					requested_tool: { name: "requested_tool", invoke: vi.fn() },
				} as any,
			},
		);

		await expect(
			orchestrator.runTool(mockState, "requested_tool"),
		).rejects.toThrow("No actions found for tool: requested_tool");
	});
});
