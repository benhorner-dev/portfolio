import { describe, expect, it, vi } from "vitest";
import { createAgentOrchestrator } from "@/lib/explore/agent";
import { ExecutionType } from "@/lib/explore/constants";
import type {
	AgentAction,
	AgentConfig,
	ExecutionStep,
	ToolName,
} from "@/lib/explore/types";

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
		AGENT_ERRORS: {},
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

describe("AgentOrchestrator scratchpad", () => {
	it("should handle multiple steps with different tools", async () => {
		const config = {
			defaultAgentActionLog: "default log message",
			tools: [],
			llms: [{ provider: "openai", providerArgs: {} }],
			answerFormatters: [{ name: "default" }],
			systemPrompt: "test prompt",
			maxIntermediateSteps: 10,
			defaultErrorMessage: "error",
		} as any as AgentConfig;

		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
		);
		const steps = [
			{
				tool: "rag_search" as ToolName,
				toolInput: { query: "test query 1" },
				log: "default log message",
			},
			{
				tool: "final_answer" as ToolName,
				toolInput: { answer: "test answer" } as any,
				log: "custom log message",
			},
		] as any[];

		const result = await orchestrator.createScratchpad([
			{ actions: [steps[0]], results: ["step1 result"], executionType: "TEST" },
			{ actions: [steps[1]], results: ["step2 result"], executionType: "TEST" },
		] as any[]);

		expect(result).toBe(
			'TEST Execution:\n\n---\nTEST Execution:\nTool: final_answer, input: {"answer":"test answer"}\nOutput: step2 result',
		);
	});

	it("should create scratchpad with only steps that do not match defaultAgentActionLog", async () => {
		const config = {
			defaultAgentActionLog: "default log message",
			tools: [],
			llms: [{ provider: "openai", providerArgs: {} }],
			answerFormatters: [{ name: "default" }],
			systemPrompt: "test prompt",
			maxIntermediateSteps: 10,
			defaultErrorMessage: "error",
		} as any as AgentConfig;
		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
		);
		const conditionMatchingStep = {
			tool: "rag_search" as ToolName,
			toolInput: { query: "test query 1" },
			log: "default log message",
		};
		const nonMatchingStep = {
			tool: "final_answer" as ToolName,
			toolInput: { answer: "test answer" } as any,
			log: "custom log message",
		};
		const intermediateSteps = [
			{
				actions: [conditionMatchingStep],
				results: ["step1 result"],
				executionType: "TEST",
			},
			{
				actions: [nonMatchingStep],
				results: ["step2 result"],
				executionType: "TEST",
			},
		] as any;
		const result = await orchestrator.createScratchpad(intermediateSteps);
		expect(result).toBe(
			`TEST Execution:\n\n---\nTEST Execution:\nTool: final_answer, input: {"answer":"test answer"}\nOutput: step2 result`,
		);
	});
	it("should handle missing results in createScratchpad", async () => {
		const config = {
			defaultAgentActionLog: "default log message",
			tools: [],
			llms: [{ provider: "openai", providerArgs: {} }],
			answerFormatters: [{ name: "default" }],
			systemPrompt: "test prompt",
			maxIntermediateSteps: 10,
			defaultErrorMessage: "error",
		} as any as AgentConfig;

		const orchestrator = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
		);

		const intermediateSteps: ExecutionStep[] = [
			{
				executionType: ExecutionType.SEQUENTIAL,
				actions: [
					{
						name: "rag_search",
						args: { query: "test query" },
					},
					{
						name: "another_tool",
						args: { input: "test" },
					},
				] as unknown as AgentAction[],
				results: ["test result"],
			},
		];

		const scratchpad = await orchestrator.createScratchpad(intermediateSteps);

		expect(scratchpad).toBeDefined();
		expect(typeof scratchpad).toBe("string");
		expect(scratchpad).toContain("test result");
	});

	describe("parseIntermediateSteps", () => {
		it("should combine intermediate steps", async () => {
			const config = {
				defaultAgentActionLog: "default log message",
				tools: [],
				llms: [{ provider: "openai", providerArgs: {} }],
				answerFormatters: [{ name: "default" }],
				systemPrompt: "test prompt",
				maxIntermediateSteps: 10,
				defaultErrorMessage: "error",
			} as any as AgentConfig;

			const orchestrator = await createAgentOrchestrator(
				config,
				MockGraphFactory as any,
			);

			const step1: ExecutionStep = {
				executionType: ExecutionType.SEQUENTIAL,
				actions: [{ name: "tool1", args: {} }] as unknown as AgentAction[],
				results: ["result1"],
			};

			const step2: ExecutionStep = {
				executionType: ExecutionType.PARALLEL,
				actions: [{ name: "tool2", args: {} }] as unknown as AgentAction[],
				results: ["result2"],
			};

			const combined = orchestrator.parseIntermediateSteps([step1], [step2]);

			expect(combined).toHaveLength(2);
			expect(combined[0]).toEqual(step1);
			expect(combined[1]).toEqual(step2);
		});
	});
});
