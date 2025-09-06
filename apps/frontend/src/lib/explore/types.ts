import type { createStreamableValue, StreamableValue } from "@ai-sdk/rsc";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ToolMessage } from "@langchain/core/messages";
import type { ChatPromptTemplate } from "@langchain/core/prompts";

import type z from "zod";
import type { ExecutionType, InterlocutorType } from "@/lib/explore/constants";
import type {
	AgentGraphError,
	TracedAgentGraphError,
	UnexpectedAgentGraphError,
} from "@/lib/explore/errors";
import type { TOOL_STATE_BINDINGS } from "@/lib/explore/maps";
import type {
	AgentConfigSchema,
	ChatIdOnlySchema,
	FinalAnswerSchema,
	RagGraphSearchSchema,
	ToolConfigSchema,
} from "@/lib/explore/schema";

export interface AgentAction {
	tool: ToolName;
	toolInput: ToolInput;
	log: string;
}

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export interface AgentResponse {
	answer: string;
	graphMermaid: string;
	error?: Error;
	scratchPad?: string;
	courseLinks: string[];
	totalTokens: number;
}

export type AgentServerAction = (
	message: string,
	config: AgentConfig,
	chatHistory: ChatMessage[],
	chatId: string,
) => Promise<StreamableValue<AgentResponse>>;

export interface AgentState {
	input: string;
	chatHistory: string;
	intermediateSteps: ExecutionStep[];
	chatId: string;
	topK: number;
	indexName: string;
	embeddingModelName: string;
	usedTools: Set<ToolName>;
	toolResults: Partial<Record<ToolName, string>>;
}

export type AgenticPipelineOutput = {
	answer: string;
	graph: string;
	courseLinks: string[];
};

export type AnswerFormatter = (result: FinalAnswerArgs) => string;

export type ChatIdOnlyArgs = z.infer<typeof ChatIdOnlySchema>;

export interface ChatMessage {
	id: string;
	content: string | null;
	type: InterlocutorType;
	timestamp?: string;
	quickReplies?: string[];
	thoughts: string[];
	inputValue?: string;
}

export interface ExecutionStep {
	actions: AgentAction[];
	results: string[];
	executionType: ExecutionType;
	timestamp?: number;
}

export interface GraphFactory {
	execute(): GraphFactoryResult;
}

export interface GraphFactoryResult {
	prompt: ChatPromptTemplate;
	llm: BaseChatModel;
	answerFormatter: AnswerFormatter;
	tools: Tool[];
}

export type GraphSearchResult = {
	id: string;
	title: string;
	vecScore: number;
	provider: string;
	overview: string;
	description: string;
	categories: string[];
	tags: string[];
	level?: number | null;
	delivery_modes: string[];
	url: string;
};

export type ErrorClass<T extends Error = Error> = new (...args: any[]) => T;

export interface Errors {
	parentError: ErrorClass<AgentGraphError>;
	unExpectedError: ErrorClass<UnexpectedAgentGraphError>;
	tracedError: ErrorClass<TracedAgentGraphError>;
}

export type FinalAnswerArgs = z.infer<typeof FinalAnswerSchema>;

export interface InjectedMaps {
	toolMap?: Record<ToolName, Tool>;
	llmMap?: Record<string, (...args: unknown[]) => unknown>;
	formatterMap?: Record<string, AnswerFormatter>;
}

export interface InjectedStateBindings {
	[key: keyof typeof TOOL_STATE_BINDINGS]: ToolStateBinding;
}

export interface MethodContext {
	className: string;
	methodName: string;
	traceId: string;
}

export type RagGraphSearchArgs = z.infer<typeof RagGraphSearchSchema>;

export type Stream = ReturnType<typeof createStreamableValue<AgentResponse>>;

export interface Tool<T = unknown> {
	name: string;
	description: string;
	invoke(input: T): Promise<string | ToolMessage>;
}

export type ToolConfig = z.infer<typeof ToolConfigSchema>;

export type ToolInput = FinalAnswerArgs | ChatIdOnlyArgs;

export type ToolName =
	| "final_answer"
	| "rag_graph_search"
	| "mock_rag_graph_search";

export interface ToolStateBinding {
	stateFields: (keyof AgentState)[];
}

export interface TraceContext {
	traceId: string;
	functionName: string;
}
