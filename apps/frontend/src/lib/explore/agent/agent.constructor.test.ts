import { describe, expect, it, vi } from "vitest";
import type { AgentConfig, Tool } from "@/lib/explore/types";
import { createAgentOrchestrator } from "./agent";

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

vi.mock("@/lib/logger", () => ({
	getLogger: () => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
	}),
}));

vi.mock("@/lib/ContentConfig/getContentConfig", () => ({
	getContentConfigForLocale: vi.fn().mockResolvedValue({
		chat: {
			defaultErrorMessage: "Test error message from config",
		},
	}),
}));

const createMockAgentConfig = (
	overrides: Partial<AgentConfig> = {},
): AgentConfig =>
	({
		langsmithUrl: "http://test.com",
		systemPrompt: "Test system prompt",
		defaultAgentActionLog: "test-log",
		llms: [{ provider: "mock", providerArgs: { model: "test" } }],
		tools: [{ name: "rag_search" }],
		initialTools: [{ name: "rag_search" }],
		maxIntermediateSteps: 5,
		answerFormatters: [{ name: "default" }],
		...overrides,
	}) as AgentConfig;

describe("AgentOrchestrator constructor", () => {
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
	it("should initialize with default maps when no injected maps are provided", async () => {
		const config = createMockAgentConfig();
		const orchestrator = (await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
		)) as any;
		expect(orchestrator).to.exist;
		expect(orchestrator.toolMap).to.deep.equal({});
	});

	it("should override default maps with injected maps", async () => {
		const config = createMockAgentConfig();
		const injectedMaps = {
			toolMap: { customTool: {} as Tool },
		};
		const mockStateBinding = {
			mock_tool: { stateFields: ["test"] },
		};
		const orchestrator = (await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
			injectedMaps as any,
			mockStateBinding as any,
		)) as any;
		expect(orchestrator.toolMap.customTool).to.exist;
		expect(orchestrator.stateBindings.mock_tool).to.exist;
	});

	describe("AgentOrchestrator parseIntermediateSteps", () => {
		it("shouldrun without error", async () => {
			const config = createMockAgentConfig();
			const injectedMaps = {
				toolMap: { customTool: {} as Tool },
			};
			const mockStateBinding = {
				mock_tool: { stateFields: ["test"] },
			};
			const orchestrator = (await createAgentOrchestrator(
				config,
				MockGraphFactory as any,
				injectedMaps as any,
				mockStateBinding as any,
			)) as any;
			orchestrator.parseIntermediateSteps(null, undefined);
		});
	});
});
