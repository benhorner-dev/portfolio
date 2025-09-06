"use server";

import { createStreamableValue } from "@ai-sdk/rsc";
import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
	type ChatPromptTemplate,
	PromptTemplate,
} from "@langchain/core/prompts";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import {
	END,
	START,
	type StateDefinition,
	StateGraph,
	type UpdateType,
} from "@langchain/langgraph";
import _ from "lodash";
import { AgentGraphFactory } from "@/lib/explore/agent/graphFactory";
import {
	readCacheHistory,
	writeChatHistory,
} from "@/lib/explore/cache/chatHistory";
import {
	DeterministicAgentTrigger,
	ExecutionType,
	OracleValues,
	VERBOSE_LOGGING,
} from "@/lib/explore/constants";
import { AgentGraphError } from "@/lib/explore/errors";
import {
	AGENT_ERRORS,
	DEFAULT_TOOL_MAP,
	DETERMINISTIC_TOOL_MAP,
	TOOL_STATE_BINDINGS,
} from "@/lib/explore/maps";
import { courseLinkParser } from "@/lib/explore/parsers/courseLinkParser";
import { finalAnswerTool } from "@/lib/explore/tools/finalAnswerTool";
import type {
	AgentAction,
	AgentConfig,
	AgenticPipelineOutput,
	AgentResponse,
	AgentState,
	AnswerFormatter,
	ChatMessage,
	ExecutionStep,
	FinalAnswerArgs,
	GraphFactory as GraphFactoryType,
	InjectedMaps,
	InjectedStateBindings,
	Stream,
	Tool,
	ToolName,
	ToolStateBinding,
} from "@/lib/explore/types";
import { TracedClass } from "@/lib/explore/utils";
import { getLogger } from "@/lib/logger";

const logger = getLogger();

export const agent = async (
	message: string,
	config: AgentConfig,
	chatHistory: ChatMessage[],
	chatId: string,
	maps: Partial<InjectedMaps> = {},
	stateBindings: InjectedStateBindings = {},
	callbacks?: BaseCallbackHandler[],
	injectedAgentOrchestrator = AgentOrchestrator,
	injectedGraphFactory = AgentGraphFactory,
) => {
	const graphFactory = new injectedGraphFactory(config, maps);
	const traceId = getTraceId(chatId);
	const stream = createStreamableValue<AgentResponse>();

	const orchestrator = new injectedAgentOrchestrator(
		config,
		graphFactory,
		traceId,
		stream,
		maps,
		stateBindings,
		callbacks,
	);

	const lastFourChats = chatHistory.slice(-4);
	const formattedLastFourChats = await formatChatHistory(lastFourChats);
	(async () => {
		try {
			const response = await orchestrator.execute(
				message,
				chatId,
				formattedLastFourChats,
			);

			stream.update(response);
			stream.done();
		} catch (e) {
			logger.error("Error in agent", e);
			stream.update({
				answer: "",
				graphMermaid: "",
				error: e as Error,
				courseLinks: [],
				totalTokens: 0,
			});
			stream.done();
		}
	})();
	return stream.value;
};

const getTraceId = (chatId: string): string => {
	const timestamp = new Date().toISOString();
	return `${timestamp}-${chatId}`;
};

@TracedClass(AGENT_ERRORS, VERBOSE_LOGGING)
class AgentOrchestrator {
	private readonly toolMap: Record<ToolName, Tool>;
	private readonly config: AgentConfig;
	private readonly stateBindings: Record<string, ToolStateBinding>;
	private allTools: Tool[] = [];
	private initialCall = true;
	private llm: BaseChatModel;
	private prompt: ChatPromptTemplate;
	private answerFormatter: AnswerFormatter;
	private totalTokens = 0;
	public toolCallCount = 0;

	constructor(
		config: AgentConfig,
		private graphFactory: GraphFactoryType,
		public traceId: string,
		private stream: Stream,
		injectedMaps: Partial<InjectedMaps> = {},
		injectedStateBindings: InjectedStateBindings = {},
		private readonly callbacks?: BaseCallbackHandler[],
	) {
		this.toolMap = {
			...DEFAULT_TOOL_MAP,
			...injectedMaps.toolMap,
		};
		this.config = config;
		this.stateBindings = {
			...TOOL_STATE_BINDINGS,
			...injectedStateBindings,
		};
		const { prompt, llm, answerFormatter, tools } = this.graphFactory.execute();
		this.llm = llm;
		this.allTools = tools;
		this.prompt = prompt;
		this.answerFormatter = answerFormatter;
	}
	/* c8 ignore start */
	getCombinedHistory(summarizedHistory: string, lastFourChats: string): string {
		return `Summarized History: ${summarizedHistory}\nLast Four Chats: ${lastFourChats}`;
	}

	async execute(
		message: string,
		chatId: string,
		lastFourChats: string,
	): Promise<AgentResponse> {
		const graph = this.graphBuilder();
		const summarizedHistory = await readCacheHistory(chatId);
		const combinedHistory = this.getCombinedHistory(
			summarizedHistory,
			lastFourChats,
		);
		const result = await graph({
			input: message,
			chatHistory: combinedHistory,
			intermediateSteps: [],
			chatId,
			topK: this.config.vectorResultsTopK,
			indexName: this.config.indexName,
			embeddingModelName: this.config.embeddingModelName,
			usedTools: new Set<ToolName>(),
			toolResults: {},
		});
		writeChatHistory(chatId, result.answer, message);

		return {
			answer: result.answer,
			graphMermaid: result.graph,
			courseLinks: result.courseLinks,
			totalTokens: this.totalTokens,
		};
	}
	graphBuilder(): (input: AgentState) => Promise<AgenticPipelineOutput> {
		const graph = new StateGraph<AgentState>({
			channels: {
				input: null,
				chatHistory: null,
				intermediateSteps: {
					reducer: this.parseIntermediateSteps,
					default: () => [] as ExecutionStep[],
				},
				chatId: null,
				indexName: null,
				topK: null,
				embeddingModelName: null,
				usedTools: {
					reducer: reduceUsedTools,
					default: () => new Set<ToolName>(),
				},
				toolResults: {
					reducer: reduceToolResults,
					default: () => ({}) as Partial<Record<ToolName, string>>,
				},
			},
		});

		graph.addNode(OracleValues.ORACLE, (state: AgentState) =>
			this.runOracle(state),
		);

		graph.addNode(OracleValues.FINAL_ANSWER, (state: AgentState) =>
			this.runTool(state, OracleValues.FINAL_ANSWER),
		);
		graph.addEdge(START, OracleValues.ORACLE as unknown as typeof START);
		for (const toolObj of this.allTools) {
			if (toolObj.name !== OracleValues.FINAL_ANSWER) {
				graph.addNode(toolObj.name, (state: AgentState) =>
					this.runTool(state, toolObj.name),
				);
				graph.addEdge(
					toolObj.name as unknown as typeof START,
					OracleValues.ORACLE as unknown as typeof START,
				);
			}
		}
		graph.addConditionalEdges(
			OracleValues.ORACLE as unknown as typeof START,
			(state) => this.router(state),
		);
		graph.addEdge(OracleValues.FINAL_ANSWER as unknown as typeof START, END);

		const runnable = graph.compile();
		return async (input: AgentState): Promise<AgenticPipelineOutput> => {
			const drawnGraph = await runnable.getGraphAsync();
			const mermaidGraph = drawnGraph.drawMermaid();
			const res = await runnable.invoke(
				input as unknown as UpdateType<StateDefinition>,
				{ callbacks: this.callbacks },
			);
			const courseLinks = courseLinkParser(res);
			const finalAnswer = this.answerFormatter(
				res as unknown as FinalAnswerArgs,
			);
			return {
				answer: finalAnswer,
				graph: mermaidGraph,
				courseLinks,
			};
		};
	}
	/* c8 ignore stop */

	async createScratchpad(intermediateSteps: ExecutionStep[]): Promise<string> {
		const researchSteps: string[] = [];
		intermediateSteps.forEach((step) => {
			const parallelOutputs = step.actions
				.map((action, index) => {
					const result = step.results[index] || "";
					if (action.log !== this.config.defaultAgentActionLog) {
						return `Tool: ${action.tool}, input: ${JSON.stringify(action.toolInput)}\nOutput: ${result}`;
					}
					return undefined;
				})
				.join("\n");

			researchSteps.push(
				`${step.executionType} Execution:\n${parallelOutputs}`,
			);
		});
		const joinedResearchSteps = researchSteps.join("\n---\n");

		return joinedResearchSteps;
	}

	getNextTool(state: AgentState): Tool[] | null {
		const lastStep = state.intermediateSteps.at(-1);

		if (!lastStep) {
			return null;
		}

		for (const tool of Object.values(DeterministicAgentTrigger)) {
			if (lastStep.results.some((result) => result.includes(tool))) {
				const nextTool = DETERMINISTIC_TOOL_MAP[tool];
				if (state.usedTools.has(nextTool.name as ToolName)) continue;
				return [nextTool];
			}
		}
		return null;
	}

	getMaxIntermediateStepsTool(state: AgentState): Tool[] | null {
		const shouldForceAnswerAsOverMaxSteps =
			state.intermediateSteps.length >= this.config.maxIntermediateSteps;
		if (!shouldForceAnswerAsOverMaxSteps) return null;
		logger.warn(
			"Triggering Final Answer tool due to max intermiediate steps being exceeded",
		);
		return [finalAnswerTool];
	}

	getInitialCallTools(): Tool[] | null {
		if (!this.initialCall) {
			return null;
		}
		this.initialCall = false;
		const tools = this.config.initialTools.map((tool) => {
			const toolFn = this.toolMap[tool.name as ToolName];
			if (!toolFn) {
				throw new AgentGraphError(
					`Initial Tool not found: ${tool.name}. The tool must be one of: ${Object.keys(this.toolMap).join(", ")}`,
				);
			}
			if (!this.allTools.includes(toolFn)) {
				throw new AgentGraphError(
					`Initial tool: ${tool.name} must be one of the tool group: ${this.allTools.map((tool) => tool.name).join(", ")}`,
				);
			}
			return toolFn;
		});
		if (tools.length < 1) {
			throw new AgentGraphError(
				`No Initial tools were found, ensure you have selected at least one from the following: ${this.allTools.map((tool) => tool.name).join(", ")}`,
			);
		}
		return tools;
	}

	async handleTriggers(state: AgentState): Promise<Tool[] | null> {
		const deterministicTools: Tool[] | null =
			this.getInitialCallTools() ||
			this.getMaxIntermediateStepsTool(state) ||
			this.getNextTool(state);

		if (!deterministicTools) {
			const availableTools = this.allTools.filter(
				(tool) =>
					tool.name === OracleValues.FINAL_ANSWER ||
					!state.usedTools.has(tool.name as ToolName),
			);
			return availableTools;
		}

		const finalAnswerInTools = deterministicTools.some(
			(call) => call.name === OracleValues.FINAL_ANSWER,
		);
		if (finalAnswerInTools) {
			const lastStep = state.intermediateSteps.at(-1);
			if (lastStep) {
				state.intermediateSteps = [lastStep];
				const [outputString] = lastStep.results;
				state.input = `${outputString}: ${state.input}`;
			}
		}
		return deterministicTools;
	}

	async runOracle(state: AgentState): Promise<Partial<AgentState>> {
		const tools = await this.handleTriggers(state);
		if (!tools) {
			throw new AgentGraphError("No Tools Found");
		}

		const thinkingPrompt = PromptTemplate.fromTemplate(`
								User query: {input}
								Available tools: {availableTools}
								Your run in parallalel with a function call llm call with the above input. Your job is to provide thoughts for this function call.
								In one brief sentence, what are your thoughts?
								`);

		const thinkingChain = RunnableSequence.from([
			thinkingPrompt,
			this.llm.withConfig({
				configurable: {
					temperature: 0.8,
					max_tokens: 50,
				},
			}),
		]);
		if (!this.llm.bindTools) {
			throw new AgentGraphError("LLM does not have bindTools method");
		}
		const oracle = RunnableSequence.from([
			RunnableLambda.from(async (callState: AgentState) => ({
				input: callState.input,
				chatHistory: callState.chatHistory,
				scratchpad: await this.createScratchpad(callState.intermediateSteps),
			})),
			this.prompt,
			this.llm.bindTools(tools, {
				tool_choice: OracleValues.CHOICE_TO_FORCE_TOOL_USE,
			}),
		]);

		const thinkingContext = {
			input: state.input,
			availableTools: tools
				.map((t) => `${t.name}: ${t.description}`)
				.join(", "),
		};

		const [thinkingResult, oracleResult] = await Promise.all([
			thinkingChain.invoke(thinkingContext),
			oracle.invoke(state),
		]);

		this.totalTokens +=
			(thinkingResult.usage_metadata?.total_tokens || 0) +
			(oracleResult.usage_metadata?.total_tokens || 0);

		const thinkingText =
			typeof thinkingResult.content === "string"
				? thinkingResult.content
				: JSON.stringify(thinkingResult.content);
		this.stream.update({
			answer: "",
			graphMermaid: "",
			scratchPad: thinkingText,
			courseLinks: [],
			totalTokens: this.totalTokens,
		});

		if (!oracleResult.tool_calls || oracleResult.tool_calls.length === 0) {
			throw new AgentGraphError(
				`No tool calls found in oracle output, reconfigure the agent to use a different combination of tools, LLM and answer formatter.
                   Current configuration: ${JSON.stringify(this.config)}
                   Available tools: ${tools.map((t) => t.name).join(", ")}
                   `,
			);
		}

		const actions = oracleResult.tool_calls.map((call) => ({
			tool: call.name,
			toolInput: call.args,
			log: this.config.defaultAgentActionLog,
		}));

		const step: ExecutionStep = {
			actions: actions as AgentAction[],
			results: new Array(actions.length).fill(""),
			executionType:
				actions.length > 1 ? ExecutionType.PARALLEL : ExecutionType.SEQUENTIAL,
			timestamp: Date.now(),
		};

		return {
			intermediateSteps: [step],
		};
	}

	async runTool(
		state: AgentState,
		toolName: string,
	): Promise<Partial<AgentState>> {
		const lastStep = state.intermediateSteps.at(-1);

		if (!lastStep?.actions || lastStep?.actions.length === 0) {
			throw new AgentGraphError("No actions found in runTool");
		}

		const actions = lastStep?.actions.filter(
			(action) => action.tool === toolName,
		);

		if (actions.length === 0) {
			throw new AgentGraphError(`No actions found for tool: ${toolName}`);
		}

		const missingTools = actions.filter((action) => !this.toolMap[action.tool]);
		if (missingTools.length > 0) {
			throw new AgentGraphError(
				`Tools not found: ${missingTools.map((a) => a.tool).join(", ")}`,
			);
		}
		const uniqueTools = _.unionBy(
			actions,
			(a) => `${a.tool}-${JSON.stringify(a.toolInput)}`,
		);

		const toolPromises = uniqueTools.map(async (action) =>
			this.getToolPromise(action, state),
		);

		const results = await Promise.all(toolPromises);

		const allActions = results.map((r) => r.action);
		const allResults = results.map((r) => r.result);

		const newUsedTools = new Set([
			...state.usedTools,
			...results.map((r) => r.toolName as ToolName),
		]);

		const newToolResults = {
			...state.toolResults,
			...results.reduce(
				(acc, r) => {
					acc[r.toolName as ToolName] = r.result;
					return acc;
				},
				{} as Partial<Record<ToolName, string>>,
			),
		};
		const executionType =
			allActions.length > 1 ? ExecutionType.PARALLEL : ExecutionType.SEQUENTIAL;
		const step: ExecutionStep = {
			actions: allActions,
			results: allResults,
			executionType,
			timestamp: Date.now(),
		};

		return {
			intermediateSteps: [step],
			usedTools: newUsedTools,
			toolResults: newToolResults,
		};
	}

	async getToolPromise(
		action: AgentAction,
		state: AgentState,
	): Promise<{
		success: boolean;
		action: AgentAction;
		result: string;
		toolName: ToolName;
	}> {
		const toolName = action.tool;
		const toolArgs = action.toolInput;
		const tool = this.toolMap[toolName];
		const binding = this.stateBindings[toolName] || { stateFields: [] };

		const injectedArgs = binding.stateFields.reduce(
			(args: any, field: string) => {
				args[field] = state[field as keyof AgentState];
				return args;
			},
			{ ...toolArgs },
		);

		const result = await tool.invoke(injectedArgs);
		return {
			success: true,
			action: {
				tool: toolName,
				toolInput: injectedArgs,
				log: String(result),
			} as AgentAction,
			result: String(result),
			toolName,
		};
	}

	parseIntermediateSteps(
		x: ExecutionStep[],
		y: ExecutionStep[],
	): ExecutionStep[] {
		const result = [...(x || []), ...(y || [])];
		return result;
	}

	router(state: AgentState): string | string[] {
		if (
			!(
				Array.isArray(state.intermediateSteps) &&
				state.intermediateSteps.length > 0
			)
		) {
			return OracleValues.FINAL_ANSWER;
		}
		const lastStep = state.intermediateSteps.at(-1);

		if (!lastStep || !lastStep.actions || lastStep.actions.length === 0) {
			logger.warn("Router: No actions found, defaulting to final_answer");
			return OracleValues.FINAL_ANSWER;
		}

		const toolNames = lastStep.actions.map((action) => action.tool);

		if (toolNames.includes(OracleValues.FINAL_ANSWER)) {
			logger.warn(
				"Router: final_answer found in parallel execution, forcing singular",
			);
			return OracleValues.FINAL_ANSWER;
		}

		logger.info(
			`Router: ${lastStep.executionType} tool execution - ${toolNames.join(", ")}`,
		);
		this.toolCallCount += toolNames.length;
		return toolNames;
	}
}

/* c8 ignore start */
// Testing helper functions to workaround 'use server' next.js directive
export const createAgentOrchestrator = async (
	config: AgentConfig,
	injectedGraphFactory: typeof AgentGraphFactory,
	injectedMaps: Partial<InjectedMaps> = {},
	stateBindings: InjectedStateBindings = {},
) => {
	const graphFactory = new injectedGraphFactory(config, injectedMaps);

	const traceId = "test-trace";
	const stream = createStreamableValue();
	return new AgentOrchestrator(
		config,
		graphFactory,
		traceId,
		stream,
		injectedMaps,
		stateBindings,
	);
};
function reduceUsedTools(x: Set<ToolName>, y: Set<ToolName>): Set<ToolName> {
	return new Set([...x, ...y]);
}

function reduceToolResults(
	x: Partial<Record<ToolName, string>>,
	y: Partial<Record<ToolName, string>>,
): Partial<Record<ToolName, string>> {
	return { ...x, ...y };
}
/* c8 ignore stop */

export const formatChatHistory = async (
	chatHistory: ChatMessage[],
): Promise<string> => {
	return chatHistory
		.map((message) => {
			const timestamp = message.timestamp
				? `[${new Date(message.timestamp).toLocaleString()}] `
				: "";
			return `${timestamp}${message.type}: ${message.content}`;
		})
		.join("\n\n");
};
