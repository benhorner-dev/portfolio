import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@langchain/core/prompts", () => ({
	ChatPromptTemplate: {
		fromMessages: vi.fn(() => ({
			invoke: vi.fn().mockResolvedValue("prompt result"),
		})),
	},
	PromptTemplate: {
		fromTemplate: vi.fn(() => ({
			invoke: vi.fn().mockResolvedValue("prompt result"),
		})),
	},
}));
vi.mock("@langchain/core/runnables", () => ({
	RunnableLambda: {
		from: vi.fn((fn) => ({
			invoke: vi.fn(fn),
		})),
	},
	RunnableSequence: {
		from: vi.fn((sequence) => {
			return {
				invoke: vi.fn().mockImplementation(async (input) => {
					let currentInput = input;
					for (const step of sequence) {
						if (step && typeof step.invoke === "function") {
							currentInput = await step.invoke(currentInput);
						}
					}
					return currentInput;
				}),
			};
		}),
	},
}));

import type { LLM } from "@langchain/core/language_models/llms";
import {
	DeterministicAgentTrigger,
	ExecutionType,
} from "@/lib/explore/constants";
import {
	AgentGraphError,
	TracedAgentGraphError,
	UnexpectedAgentGraphError,
} from "@/lib/explore/errors";
import type {
	AgentAction,
	AgentConfig,
	AgentState,
	ExecutionStep,
	ToolName,
} from "@/lib/explore/types";
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
		DETERMINISTIC_TOOL_MAP: {
			[DeterministicAgentTrigger.ABORT]: { name: "next_tool" },
		},
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

const mockLLM = {
	bindTools: vi.fn((tools) => ({
		invoke: vi.fn().mockResolvedValue({
			tool_calls: [
				{
					name: tools[0]?.name || "rag_search",
					args:
						tools[0]?.name === "final_answer"
							? { answer: "final answer" }
							: { query: "test query" },
				},
			],
			usage_metadata: { total_tokens: 10 },
		}),
	})),
	withConfig: vi.fn(() => ({
		invoke: vi.fn().mockResolvedValue({
			content: "thinking result",
			usage_metadata: { total_tokens: 5 },
		}),
	})),
} as any;
const mockFormatter = () => "formatted response";
class MockGraphFactory {
	execute() {
		return {
			prompt: {
				invoke: vi.fn().mockResolvedValue("prompt result"),
			},
			llm: mockLLM,
			answerFormatter: mockFormatter,
			tools: [
				{ name: "rag_search", description: "Search for information" },
				{ name: "final_answer", description: "Provide final answer" },
			],
		};
	}
}

describe("AgentOrchestrator runOracle", () => {
	let config: AgentConfig;
	let orchestrator: any;
	let mockState: AgentState;

	beforeEach(async () => {
		config = {
			defaultAgentActionLog: "default log",
			tools: [],
			initialTools: [],
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
		orchestrator.initialCall = false;
		orchestrator.stream = {
			update: vi.fn(),
		};
		mockState = {
			input: "test input",
			chat_history: [],
			intermediateSteps: [],
			usedTools: new Set(),
		} as any;
	});

	it("should throw AgentGraphError when tool_calls is undefined", async () => {
		const mockOracle = {
			bindTools: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({}),
			})),
			withConfig: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					content: "thinking result",
					usage_metadata: { total_tokens: 5 },
				}),
			})),
		} as any;

		orchestrator.llm = mockOracle;

		await expect(orchestrator.runOracle(mockState)).rejects.toThrow(
			"No tool calls found in oracle output",
		);
	});

	it("should throw AgentGraphError when tool_calls is empty array", async () => {
		const mockOracle = {
			bindTools: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({ tool_calls: [] }),
			})),
			withConfig: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					content: "thinking result",
					usage_metadata: { total_tokens: 5 },
				}),
			})),
		} as unknown as LLM;
		orchestrator.llm = mockOracle;
		await expect(orchestrator.runOracle(mockState)).rejects.toThrow(
			"No tool calls found in oracle output",
		);
	});

	it.skip("should return intermediate_steps when over max tool_calls exists", async () => {
		const mockOracle = {
			bindTools: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					tool_calls: [
						{
							name: "final_answer",
							args: { answer: "final answer" },
						},
					],
					usage_metadata: { total_tokens: 10 },
				}),
			})),
			withConfig: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					content: "thinking result",
					usage_metadata: { total_tokens: 5 },
				}),
			})),
		} as any;
		mockState.intermediateSteps = [
			{
				actions: [
					{
						tool: "rag_search" as ToolName,
						toolInput: { query: "test query" } as any,
						log: "default log",
					},
				],
				results: [""],
			},
			{
				actions: [
					{
						tool: "rag_search" as ToolName,
						toolInput: { query: "test query" },
						log: "default log",
					},
				],
				results: [""],
			},
			{
				actions: [
					{
						tool: "rag_search" as ToolName,
						toolInput: { query: "test query" },
						log: "default log",
					},
				],
				results: [""],
			},
		] as any;
		orchestrator.llm = mockOracle;
		const result = await orchestrator.runOracle(mockState);
		expect(result.intermediateSteps).toEqual([
			{
				actions: [
					{
						tool: "final_answer",
						toolInput: { answer: "final answer" },
						log: "default log",
					},
				],
				results: [""],
				executionType: "sequential",
				timestamp: expect.any(Number),
			},
		]);
	});

	it("should throw AgentGraphError when tools is null or undefined", async () => {
		const orchestratorWithNoTools = await createAgentOrchestrator(
			config,
			MockGraphFactory as any,
		);
		(orchestratorWithNoTools as any).initialCall = false;
		orchestratorWithNoTools.handleTriggers = vi.fn().mockResolvedValue(null);

		await expect(orchestratorWithNoTools.runOracle(mockState)).rejects.toThrow(
			"No Tools Found",
		);
	});

	it("should throw AgentGraphError when LLM does not have bindTools method", async () => {
		const mockOracleWithoutBindTools = {
			withConfig: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					content: "thinking result",
					usage_metadata: { total_tokens: 5 },
				}),
			})),
		};
		orchestrator.llm = mockOracleWithoutBindTools;

		await expect(orchestrator.runOracle(mockState)).rejects.toThrow(
			"LLM does not have bindTools method",
		);
	});

	it("should handle thinkingResult.content as object and convert to JSON string", async () => {
		const mockOracle = {
			bindTools: vi.fn((tools, options) => {
				const mockInvoke = vi.fn((input) => {
					const result = {
						tool_calls: [
							{
								name: "rag_search",
								args: { query: "test query" },
							},
						],
						usage_metadata: { total_tokens: 10 },
					};
					return Promise.resolve(result);
				});
				return {
					invoke: mockInvoke,
				};
			}),
			withConfig: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					content: { type: "thinking", message: "complex thinking" },
					usage_metadata: { total_tokens: 5 },
				}),
			})),
		} as unknown as LLM;

		orchestrator.llm = mockOracle;

		orchestrator.handleTriggers = vi
			.fn()
			.mockResolvedValue([
				{ name: "rag_search", description: "Search for information" },
			]);

		const result = await orchestrator.runOracle(mockState);

		expect(orchestrator.stream.update).toHaveBeenCalledWith({
			answer: "",
			graphMermaid: "",
			scratchPad: JSON.stringify({
				type: "thinking",
				message: "complex thinking",
			}),
			courseLinks: [],
			totalTokens: expect.any(Number),
		});
		expect(result.intermediateSteps).toHaveLength(1);
	});

	it("should handle token counting with undefined usage_metadata", async () => {
		const mockOracle = {
			bindTools: vi.fn((tools, options) => {
				const mockInvoke = vi.fn((input) => {
					return Promise.resolve({
						tool_calls: [
							{
								name: "rag_search",
								args: { query: "test query" },
							},
						],
					});
				});
				return {
					invoke: mockInvoke,
				};
			}),
			withConfig: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					content: "thinking",
				}),
			})),
		} as unknown as LLM;

		orchestrator.llm = mockOracle;

		orchestrator.handleTriggers = vi
			.fn()
			.mockResolvedValue([
				{ name: "rag_search", description: "Search for information" },
			]);

		const result = await orchestrator.runOracle(mockState);

		expect(result.intermediateSteps).toHaveLength(1);
		expect(orchestrator.stream.update).toHaveBeenCalledWith(
			expect.objectContaining({
				totalTokens: 0,
			}),
		);
	});

	it("should handle token counting with partial usage_metadata", async () => {
		const mockOracle = {
			bindTools: vi.fn((tools, options) => {
				const mockInvoke = vi.fn((input) => {
					return Promise.resolve({
						tool_calls: [
							{
								name: "rag_search",
								args: { query: "test query" },
							},
						],
						usage_metadata: { total_tokens: 15 },
					});
				});
				return {
					invoke: mockInvoke,
				};
			}),
			withConfig: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					content: "thinking",
					usage_metadata: { total_tokens: 5 },
				}),
			})),
		} as unknown as LLM;

		orchestrator.llm = mockOracle;

		orchestrator.handleTriggers = vi
			.fn()
			.mockResolvedValue([
				{ name: "rag_search", description: "Search for information" },
			]);

		const result = await orchestrator.runOracle(mockState);

		expect(result.intermediateSteps).toHaveLength(1);
		expect(orchestrator.stream.update).toHaveBeenCalledWith(
			expect.objectContaining({
				totalTokens: 20,
			}),
		);
	});

	it("should handle oracle result token counting", async () => {
		vi.doUnmock("@langchain/core/runnables");

		const mockOracle = {
			bindTools: vi.fn((tools, options) => {
				const mockInvoke = vi.fn((input) => {
					return Promise.resolve({
						tool_calls: [
							{
								name: "rag_search",
								args: { query: "test query" },
							},
						],
						usage_metadata: { total_tokens: 20 },
					});
				});
				return {
					invoke: mockInvoke,
				};
			}),
			withConfig: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					content: "thinking",
					usage_metadata: { total_tokens: 10 },
				}),
			})),
		} as unknown as LLM;

		orchestrator.llm = mockOracle;

		orchestrator.handleTriggers = vi
			.fn()
			.mockResolvedValue([
				{ name: "rag_search", description: "Search for information" },
			]);

		const result = await orchestrator.runOracle(mockState);

		expect(result.intermediateSteps).toHaveLength(1);
		expect(orchestrator.stream.update).toHaveBeenCalledWith(
			expect.objectContaining({
				totalTokens: 30,
			}),
		);

		vi.doMock("@langchain/core/runnables", () => ({
			RunnableSequence: {
				from: vi.fn((runnables) => ({
					invoke: vi.fn(async (input) => {
						const lambda = runnables.find(
							(r: any) => r._getType?.() === "RunnableLambda",
						);
						if (lambda) {
							return await lambda.invoke(input);
						}
						return input;
					}),
				})),
			},
			RunnableLambda: {
				from: vi.fn((fn) => ({
					invoke: fn,
					_getType: () => "RunnableLambda",
				})),
			},
		}));
	});

	it("should handle oracle result token counting", async () => {
		vi.doUnmock("@langchain/core/runnables");

		const mockOracle = {
			bindTools: vi.fn((tools, options) => {
				const mockInvoke = vi.fn((input) => {
					return Promise.resolve({
						tool_calls: [
							{
								name: "rag_search",
								args: { query: "test query" },
							},
						],
						usage_metadata: { total_tokens: undefined },
					});
				});
				return {
					invoke: mockInvoke,
				};
			}),
			withConfig: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					content: "thinking",
					usage_metadata: { total_tokens: undefined },
				}),
			})),
		} as unknown as LLM;

		orchestrator.llm = mockOracle;

		orchestrator.handleTriggers = vi
			.fn()
			.mockResolvedValue([
				{ name: "rag_search", description: "Search for information" },
			]);

		const result = await orchestrator.runOracle(mockState);

		expect(result.intermediateSteps).toHaveLength(1);
		expect(orchestrator.stream.update).toHaveBeenCalledWith(
			expect.objectContaining({
				totalTokens: 0,
			}),
		);

		vi.doMock("@langchain/core/runnables", () => ({
			RunnableSequence: {
				from: vi.fn((runnables) => ({
					invoke: vi.fn(async (input) => {
						const lambda = runnables.find(
							(r: any) => r._getType?.() === "RunnableLambda",
						);
						if (lambda) {
							return await lambda.invoke(input);
						}
						return input;
					}),
				})),
			},
			RunnableLambda: {
				from: vi.fn((fn) => ({
					invoke: fn,
					_getType: () => "RunnableLambda",
				})),
			},
		}));
	});

	it("should parse intermediate steps", async () => {
		const step1: ExecutionStep = {
			executionType: "SEQUENTIAL" as any,
			actions: [{ name: "tool1", args: {} }] as unknown as AgentAction[],
			results: ["result1"],
		};

		const step2: ExecutionStep = {
			executionType: "PARALLEL" as any,
			actions: [{ name: "tool2", args: {} }] as unknown as AgentAction[],
			results: ["result2"],
		};

		const combined = orchestrator.parseIntermediateSteps([step1], [step2]);

		expect(combined).toHaveLength(2);
		expect(combined[0]).toEqual(step1);
		expect(combined[1]).toEqual(step2);
	});

	it("should create ExecutionStep with PARALLEL execution type for multiple tool calls", async () => {
		const mockOracle = {
			bindTools: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					tool_calls: [
						{
							name: "rag_search",
							args: { query: "test query 1" },
						},
						{
							name: "final_answer",
							args: { answer: "test answer" },
						},
					],
					usage_metadata: { total_tokens: 15 },
				}),
			})),
			withConfig: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					content: "thinking result",
					usage_metadata: { total_tokens: 5 },
				}),
			})),
		} as unknown as LLM;

		orchestrator.llm = mockOracle;

		orchestrator.handleTriggers = vi.fn().mockResolvedValue([
			{ name: "rag_search", description: "Search for information" },
			{ name: "final_answer", description: "Provide final answer" },
		]);

		const result = await orchestrator.runOracle(mockState);

		expect(result.intermediateSteps).toHaveLength(1);
		expect(result.intermediateSteps[0].actions).toHaveLength(2);
		expect(result.intermediateSteps[0].actions[0]).toEqual({
			tool: "rag_search",
			toolInput: { query: "test query 1" },
			log: "default log",
		});
		expect(result.intermediateSteps[0].actions[1]).toEqual({
			tool: "final_answer",
			toolInput: { answer: "test answer" },
			log: "default log",
		});
		expect(result.intermediateSteps[0].executionType).toBe(
			ExecutionType.PARALLEL,
		);
		expect(result.intermediateSteps[0].results).toEqual(["", ""]);
		expect(result.intermediateSteps[0].timestamp).toBeTypeOf("number");
	});

	it("should create ExecutionStep with SEQUENTIAL execution type for single tool call", async () => {
		const mockOracle = {
			bindTools: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					tool_calls: [
						{
							name: "rag_search",
							args: { query: "single test query" },
						},
					],
					usage_metadata: { total_tokens: 10 },
				}),
			})),
			withConfig: vi.fn(() => ({
				invoke: vi.fn().mockResolvedValue({
					content: "thinking result",
					usage_metadata: { total_tokens: 5 },
				}),
			})),
		} as unknown as LLM;

		orchestrator.llm = mockOracle;

		orchestrator.handleTriggers = vi
			.fn()
			.mockResolvedValue([
				{ name: "rag_search", description: "Search for information" },
			]);

		const result = await orchestrator.runOracle(mockState);

		expect(result.intermediateSteps).toHaveLength(1);
		expect(result.intermediateSteps[0].actions).toHaveLength(1);
		expect(result.intermediateSteps[0].actions[0]).toEqual({
			tool: "rag_search",
			toolInput: { query: "single test query" },
			log: "default log",
		});
		expect(result.intermediateSteps[0].executionType).toBe(
			ExecutionType.SEQUENTIAL,
		);
		expect(result.intermediateSteps[0].results).toEqual([""]);
		expect(result.intermediateSteps[0].timestamp).toBeTypeOf("number");
	});
	describe("AgentOrchestrator handleTriggers", () => {
		let config: AgentConfig;
		let orchestrator: any;
		let mockState: AgentState;

		beforeEach(async () => {
			config = {
				defaultAgentActionLog: "default log",
				tools: [],
				initialTools: [],
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

			mockState = {
				input: "test input",
				chat_history: [],
				intermediateSteps: [],
				usedTools: new Set(),
			} as any;
		});

		it("should return initial call tools when initialCall is true", async () => {
			(orchestrator as any).initialCall = true;
			orchestrator.getInitialCallTools = vi
				.fn()
				.mockReturnValue([{ name: "initial_tool" }]);
			orchestrator.getMaxIntermediateStepsTool = vi.fn();
			orchestrator.getNextTool = vi.fn();

			const result = await orchestrator.handleTriggers(mockState);

			expect(orchestrator.getInitialCallTools).toHaveBeenCalled();
			expect(orchestrator.getMaxIntermediateStepsTool).not.toHaveBeenCalled();
			expect(orchestrator.getNextTool).not.toHaveBeenCalled();
			expect(result).toEqual([{ name: "initial_tool" }]);
		});

		it("should return max intermediate steps tool when available", async () => {
			(orchestrator as any).initialCall = false;
			orchestrator.getInitialCallTools = vi.fn().mockReturnValue(null);
			orchestrator.getMaxIntermediateStepsTool = vi
				.fn()
				.mockReturnValue([{ name: "max_steps_tool" }]);
			orchestrator.getNextTool = vi.fn();

			const result = await orchestrator.handleTriggers(mockState);

			expect(orchestrator.getInitialCallTools).toHaveBeenCalled();
			expect(orchestrator.getMaxIntermediateStepsTool).toHaveBeenCalledWith(
				mockState,
			);
			expect(orchestrator.getNextTool).not.toHaveBeenCalled();
			expect(result).toEqual([{ name: "max_steps_tool" }]);
		});

		it("should return next tool when available", async () => {
			(orchestrator as any).initialCall = false;
			orchestrator.getInitialCallTools = vi.fn().mockReturnValue(null);
			orchestrator.getMaxIntermediateStepsTool = vi.fn().mockReturnValue(null);
			orchestrator.getNextTool = vi
				.fn()
				.mockReturnValue([{ name: "next_tool" }]);

			const result = await orchestrator.handleTriggers(mockState);

			expect(orchestrator.getInitialCallTools).toHaveBeenCalled();
			expect(orchestrator.getMaxIntermediateStepsTool).toHaveBeenCalledWith(
				mockState,
			);
			expect(orchestrator.getNextTool).toHaveBeenCalledWith(mockState);
			expect(result).toEqual([{ name: "next_tool" }]);
		});

		it("should return available tools when no deterministic tools found", async () => {
			(orchestrator as any).initialCall = false;
			orchestrator.getInitialCallTools = vi.fn().mockReturnValue(null);
			orchestrator.getMaxIntermediateStepsTool = vi.fn().mockReturnValue(null);
			orchestrator.getNextTool = vi.fn().mockReturnValue(null);
			orchestrator.allTools = [
				{ name: "final_answer" },
				{ name: "used_tool" },
				{ name: "available_tool" },
			];
			mockState.usedTools = new Set(["used_tool"]) as any;

			const result = await orchestrator.handleTriggers(mockState);

			expect(result).toEqual([
				{ name: "final_answer" },
				{ name: "available_tool" },
			]);
		});

		it("should modify state when final answer is in deterministic tools", async () => {
			(orchestrator as any).initialCall = false;
			orchestrator.getInitialCallTools = vi
				.fn()
				.mockReturnValue([{ name: "final_answer" }]);

			mockState.intermediateSteps = [
				{
					actions: [{ tool: "some_tool", toolInput: {}, log: "log" }],
					results: ["previous result"],
				},
				{
					actions: [{ tool: "another_tool", toolInput: {}, log: "log" }],
					results: ["final result"],
				},
			] as any;
			const originalInput = mockState.input;

			const result = await orchestrator.handleTriggers(mockState);

			expect(mockState.intermediateSteps).toHaveLength(1);
			expect(mockState.intermediateSteps[0].results).toEqual(["final result"]);
			expect(mockState.input).toBe(`final result: ${originalInput}`);
			expect(result).toEqual([{ name: "final_answer" }]);
		});

		it("should handle empty intermediate steps when final answer is in tools", async () => {
			(orchestrator as any).initialCall = false;
			orchestrator.getInitialCallTools = vi
				.fn()
				.mockReturnValue([{ name: "final_answer" }]);

			mockState.intermediateSteps = [];
			const originalInput = mockState.input;

			const result = await orchestrator.handleTriggers(mockState);

			expect(mockState.intermediateSteps).toEqual([]);
			expect(mockState.input).toBe(originalInput);
			expect(result).toEqual([{ name: "final_answer" }]);
		});

		it("should throw error when allTools is null and no deterministic tools found", async () => {
			(orchestrator as any).initialCall = false;
			orchestrator.getInitialCallTools = vi.fn().mockReturnValue(null);
			orchestrator.getMaxIntermediateStepsTool = vi.fn().mockReturnValue(null);
			orchestrator.getNextTool = vi.fn().mockReturnValue(null);
			orchestrator.allTools = null;

			await expect(orchestrator.handleTriggers(mockState)).rejects.toThrow();
		});
	});

	describe("AgentOrchestrator getInitialCallTools", () => {
		let config: AgentConfig;
		let orchestrator: any;

		beforeEach(async () => {
			config = {
				defaultAgentActionLog: "default log",
				tools: [],
				initialTools: [],
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
		});

		it("should return null when initialCall is false", () => {
			(orchestrator as any).initialCall = false;

			const result = orchestrator.getInitialCallTools();

			expect(result).toBeNull();
		});

		it("should set initialCall to false and return tools when initialCall is true", () => {
			const mockTool = { name: "test_tool", invoke: vi.fn() };
			(orchestrator as any).initialCall = true;
			orchestrator.config.initialTools = [{ name: "test_tool" }];
			orchestrator.toolMap = { test_tool: mockTool };
			orchestrator.allTools = [mockTool];

			const result = orchestrator.getInitialCallTools();

			expect((orchestrator as any).initialCall).toBe(false);
			expect(result).toEqual([mockTool]);
		});

		it("should throw error when initial tool not found in toolMap", () => {
			(orchestrator as any).initialCall = true;
			orchestrator.config.initialTools = [{ name: "missing_tool" }];
			orchestrator.toolMap = { existing_tool: { name: "existing_tool" } };
			orchestrator.allTools = [];

			expect(() => orchestrator.getInitialCallTools()).toThrow(
				"Initial Tool not found: missing_tool. The tool must be one of: existing_tool",
			);
		});

		it("should throw error when initial tool not in allTools", () => {
			const mockTool = { name: "test_tool", invoke: vi.fn() };
			const otherTool = { name: "other_tool", invoke: vi.fn() };
			(orchestrator as any).initialCall = true;
			orchestrator.config.initialTools = [{ name: "test_tool" }];
			orchestrator.toolMap = { test_tool: mockTool };
			orchestrator.allTools = [otherTool];

			expect(() => orchestrator.getInitialCallTools()).toThrow(
				"Initial tool: test_tool must be one of the tool group: other_tool",
			);
		});

		it("should throw error when no initial tools found after filtering", () => {
			(orchestrator as any).initialCall = true;
			orchestrator.config.initialTools = [];
			orchestrator.toolMap = {};
			orchestrator.allTools = [{ name: "available_tool" }];

			expect(() => orchestrator.getInitialCallTools()).toThrow(
				"No Initial tools were found, ensure you have selected at least one from the following: available_tool",
			);
		});

		it("should return multiple tools when multiple initial tools are configured", () => {
			const mockTool1 = { name: "tool1", invoke: vi.fn() };
			const mockTool2 = { name: "tool2", invoke: vi.fn() };
			(orchestrator as any).initialCall = true;
			orchestrator.config.initialTools = [{ name: "tool1" }, { name: "tool2" }];
			orchestrator.toolMap = { tool1: mockTool1, tool2: mockTool2 };
			orchestrator.allTools = [mockTool1, mockTool2];

			const result = orchestrator.getInitialCallTools();

			expect(result).toEqual([mockTool1, mockTool2]);
		});
	});

	describe("AgentOrchestrator getNextTool", () => {
		let config: AgentConfig;
		let orchestrator: any;
		let mockState: AgentState;

		beforeEach(async () => {
			config = {
				defaultAgentActionLog: "default log",
				tools: [],
				initialTools: [],
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

			mockState = {
				input: "test input",
				chat_history: [],
				intermediateSteps: [],
				usedTools: new Set(),
			} as any;

			vi.doMock("@/lib/explore/constants", () => ({
				DeterministicAgentTrigger: {
					TRIGGER_1: "TRIGGER_1",
					TRIGGER_2: "TRIGGER_2",
				},
			}));
		});

		it("should return null when no intermediate steps exist", () => {
			mockState.intermediateSteps = [];

			const result = orchestrator.getNextTool(mockState);

			expect(result).toBeNull();
		});

		it("should return null when no trigger found in results", () => {
			mockState.intermediateSteps = [
				{
					actions: [{ tool: "some_tool", toolInput: {}, log: "log" }],
					results: ["no trigger here"],
				},
			] as any;

			const result = orchestrator.getNextTool(mockState);

			expect(result).toBeNull();
		});

		it("should return tool when matching tools not already used", () => {
			mockState.intermediateSteps = [
				{
					actions: [{ tool: "some_tool", toolInput: {}, log: "log" }],
					results: ["Result contains __ABORT__ trigger"],
				},
			] as any;

			const result = orchestrator.getNextTool(mockState);

			expect(result).toEqual([{ name: "next_tool" }]);
		});

		it("should return null when all matching tools are already used", () => {
			mockState.intermediateSteps = [
				{
					actions: [{ tool: "some_tool", toolInput: {}, log: "log" }],
					results: ["Result contains __ABORT__ trigger"],
				},
			] as any;
			mockState.usedTools = new Set(["next_tool"]) as any;

			const result = orchestrator.getNextTool(mockState);

			expect(result).toBeNull();
		});
	});
	describe("AgentOrchestrator getMaxIntermediateStepsTool", () => {
		let config: AgentConfig;
		let orchestrator: any;
		let mockState: AgentState;

		beforeEach(async () => {
			config = {
				defaultAgentActionLog: "default log",
				tools: [],
				initialTools: [],
				llms: [{ provider: "openai", providerArgs: {} }],
				answerFormatters: [{ name: "default" }],
				systemPrompt: "test prompt",
				maxIntermediateSteps: 1,
				defaultErrorMessage: "error",
			} as any as AgentConfig;

			orchestrator = await createAgentOrchestrator(
				config,
				MockGraphFactory as any,
			);

			mockState = {
				input: "test input",
				chat_history: [],
				intermediateSteps: [],
				usedTools: new Set(),
			} as unknown as AgentState;
		});

		it("should return finalAnswerTool when intermediateSteps is greater than maxIntermediateSteps", () => {
			mockState.intermediateSteps = [
				{
					actions: [{ tool: "some_tool", toolInput: {}, log: "log" }],
					results: ["Result contains __ABORT__ trigger"],
				},
			] as unknown as ExecutionStep[];
			mockState.usedTools = new Set(["next_tool"]) as unknown as Set<ToolName>;

			const result = orchestrator.getMaxIntermediateStepsTool(mockState);

			expect(result[0].name).toBe("final_answer");
		});
	});
});
