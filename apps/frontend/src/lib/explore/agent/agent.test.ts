import { createStreamableValue } from "@ai-sdk/rsc";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
	AgentGraphError,
	TracedAgentGraphError,
	UnexpectedAgentGraphError,
} from "@/lib/explore/errors";
import { agent } from "./agent";

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
	createStreamableValue: vi.fn((initialValue) => {
		let currentValue = initialValue;
		return {
			get value() {
				return currentValue;
			},
			update: vi.fn((newValue) => {
				currentValue = newValue;
			}),
			done: vi.fn(),
		};
	}),
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

class MockAgentOrchestrator {
	execute() {
		return Promise.resolve("test orchestrator");
	}
}

class MockAgentOrchestratorErrorThrowe {
	execute() {
		throw Error("test error");
	}
}

describe("agent", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should create stream and execute agent with basic parameters", async () => {
		const chatHistory = [] as any;
		const chatId = "test";
		const config = {} as any;

		await agent(
			"test_message",
			config,
			chatHistory,
			chatId,
			undefined,
			undefined,
			undefined,
			MockAgentOrchestrator as any,
			MockGraphFactory as any,
		);

		await new Promise((resolve) => setTimeout(resolve, 0));

		const mockCreateStreamableValue = vi.mocked(createStreamableValue);
		const streamInstance = mockCreateStreamableValue.mock.results[0].value;

		expect(streamInstance.update.mock.calls.length).to.eq(1);
		expect(streamInstance.update.mock.calls[0][0]).to.eq("test orchestrator");
		expect(streamInstance.done.mock.calls.length).to.eq(1);
	});

	it("should create stream with placeholders and error", async () => {
		const chatHistory = [] as any;
		const chatId = "test";
		const config = {} as any;

		await agent(
			"test_message",
			config,
			chatHistory,
			chatId,
			undefined,
			undefined,
			undefined,
			MockAgentOrchestratorErrorThrowe as any,
			MockGraphFactory as any,
		);

		await new Promise((resolve) => setTimeout(resolve, 0));
		const mockCreateStreamableValue = vi.mocked(createStreamableValue);
		const streamInstance = mockCreateStreamableValue.mock.results[0].value;

		expect(streamInstance.update.mock.calls.length).to.eq(1);
		const updateCall = streamInstance.update.mock.calls[0][0];
		expect(updateCall.answer).to.eq("");
		expect(updateCall.graphMermaid).to.eq("");
		expect(updateCall.richContent).to.eq(undefined);
		expect(updateCall.error).instanceOf(Error);
		expect(updateCall.error.message).to.eq("test error");
		expect(streamInstance.done.mock.calls.length).to.eq(1);
	});
});
