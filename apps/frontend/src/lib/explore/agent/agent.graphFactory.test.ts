import { describe, expect, it, vi } from "vitest";
import {
	AgentGraphError,
	TracedAgentGraphError,
	UnexpectedAgentGraphError,
} from "@/lib/explore/errors";
import type { AgentConfig, Tool } from "@/lib/explore/types";
import { AgentGraphFactory } from "./graphFactory";

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
describe("AgentOrchestrator graphFactory", () => {
	it("should select the correct tooling, formatter and LLM based on the config", async () => {
		const config = {
			llms: [
				{
					provider: "testLLM",
				},
			],
			tools: [
				{
					name: "testTool",
				},
			],
			answerFormatters: [
				{
					name: "testFormatter",
				},
			],
			systemPrompt: "test system prompt",
		} as any as AgentConfig;

		const testLLM = () => "test response";
		const testTool = {} as Tool;
		const testFormatter = () => "formatted response";

		const maps = {
			toolMap: { testTool },
			llmMap: { testLLM },
			formatterMap: { testFormatter },
		} as any;
		const graphFactory = new AgentGraphFactory(config, maps);

		const graph = graphFactory.execute() as any;
		expect(graph.tools).to.include(testTool);
		expect(graph.llms).to.include(testLLM);
		expect(graph.formatters).to.include(testFormatter);
	});

	it("should throw and AgentGraphError if a tool name in the config is not in the tool map", async () => {
		const config = {
			llms: [
				{
					provider: "testLLM",
				},
			],
			tools: [
				{
					name: "testTool",
				},
			],
			answerFormatters: [
				{
					name: "testFormatter",
				},
			],
			systemPrompt: "test system prompt",
		} as any as AgentConfig;

		const testLLM = () => "test response";
		const nonMatchTestTool = {} as Tool;
		const testFormatter = () => "formatted response";

		const maps = {
			toolMap: { nonMatchTestTool },
			llmMap: { testLLM },
			formatterMap: { testFormatter },
		} as any;

		const graphFactory = new AgentGraphFactory(config, maps);
		try {
			graphFactory.execute();
		} catch (e) {
			expect((e as Error).message).toEqual(
				"Tool not found: testTool. The tool must be one of: nonMatchTestTool",
			);
		}
	});

	it("should throw and AgentGraphError if a formatter name in the config is not in the formatter map", async () => {
		const config = {
			llms: [
				{
					provider: "testLLM",
				},
			],
			tools: [
				{
					name: "testTool",
				},
			],
			answerFormatters: [
				{
					name: "testFormatter",
				},
			],
			systemPrompt: "test system prompt",
		} as any as AgentConfig;

		const testLLM = () => "test response";
		const testTool = {} as Tool;
		const nonMatchingFormatter = () => "formatted response";

		const maps = {
			toolMap: { testTool },
			llmMap: { testLLM },
			formatterMap: { nonMatchingFormatter },
		} as any;

		const graphFactory = new AgentGraphFactory(config, maps);
		try {
			graphFactory.execute();
		} catch (e) {
			expect((e as Error).message).toEqual(
				"Answer formatter not found: testFormatter. The answer formatter must be one of: nonMatchingFormatter",
			);
		}
	});

	it("should throw and AgentGraphError if an llm name in the config is not in the llm map", async () => {
		const config = {
			llms: [
				{
					provider: "testLLM",
				},
			],
			tools: [
				{
					name: "testTool",
				},
			],
			answerFormatters: [
				{
					name: "testFormatter",
				},
			],
			systemPrompt: "test system prompt",
		} as any as AgentConfig;

		const nonMatchingLLM = () => "test response";
		const testTool = {} as Tool;
		const testFormatter = () => "formatted response";

		const maps = {
			toolMap: { testTool },
			llmMap: { nonMatchingLLM },
			formatterMap: { testFormatter },
		} as any;

		const graphFactory = new AgentGraphFactory(config, maps);
		try {
			graphFactory.execute();
		} catch (e) {
			expect((e as Error).message).toEqual(
				"LLM not found: testLLM. The LLM provider must be one of: nonMatchingLLM",
			);
		}
	});

	it("should throw and AgentGraphError if no llms kv pair in the config is an empty array", async () => {
		const config = {
			llms: [],
			tools: [
				{
					name: "testTool",
				},
			],
			answerFormatters: [
				{
					name: "testFormatter",
				},
			],
			systemPrompt: "test system prompt",
		} as any as AgentConfig;

		const testLLM = () => "test response";
		const testTool = {} as Tool;
		const testFormatter = () => "formatted response";

		const maps = {
			toolMap: { testTool },
			llmMap: { testLLM },
			formatterMap: { testFormatter },
		} as any;

		const graphFactory = new AgentGraphFactory(config, maps);
		try {
			graphFactory.execute();
		} catch (e) {
			expect((e as Error).message).toEqual("No LLM configuration provided");
		}
	});

	it("should throw and AgentGraphError if no answer formatters are provided", async () => {
		const config = {
			llms: [
				{
					provider: "testLLM",
				},
			],
			tools: [
				{
					name: "testTool",
				},
			],
			answerFormatters: [],
			systemPrompt: "test system prompt",
		} as any as AgentConfig;

		const testLLM = () => "test response";
		const testTool = {} as Tool;
		const testFormatter = () => "formatted response";

		const maps = {
			toolMap: { testTool },
			llmMap: { testLLM },
			formatterMap: { testFormatter },
		} as any;

		const graphFactory = new AgentGraphFactory(config, maps);
		try {
			graphFactory.execute();
		} catch (e) {
			expect((e as Error).message).toEqual(
				"No answer formatter configuration provided",
			);
		}
	});
});
