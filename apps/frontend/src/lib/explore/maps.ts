import {
	DeterministicAgentTrigger,
	ToolBindingKeys,
} from "@/lib/explore/constants";
import {
	AgentGraphError,
	TracedAgentGraphError,
	UnexpectedAgentGraphError,
} from "@/lib/explore/errors";
import { getMockLLM } from "@/lib/explore/llms/mockLLM";
import { getOpenAiLLM } from "@/lib/explore/llms/openai";
import { defaultAnswerFormatter } from "@/lib/explore/parsers/oracleResponseParser";
import { thoughtlessAnswerFormatter } from "@/lib/explore/parsers/thoughtlessOracleResponseParser";
import { finalAnswerTool } from "@/lib/explore/tools/finalAnswerTool";
import { ragGraphSearchTool } from "@/lib/explore/tools/ragGraphSearchTool";

import type {
	AnswerFormatter,
	Tool,
	ToolName,
	ToolStateBinding,
} from "@/lib/explore/types";
import { mockRagGraphSearchTool } from "./tools/mockRag";

export const AGENT_ERRORS = {
	parentError: AgentGraphError,
	unExpectedError: UnexpectedAgentGraphError,
	tracedError: TracedAgentGraphError,
};

export const DEFAULT_FORMATTER_MAP: Record<string, AnswerFormatter> = {
	default: defaultAnswerFormatter,
	thoughtless: thoughtlessAnswerFormatter,
};

export const DEFAULT_LLM_MAP: Record<string, (...args: any[]) => any> = {
	mock: getMockLLM,
	openai: getOpenAiLLM,
};

export const DEFAULT_TOOL_MAP: Record<ToolName, Tool> = {
	final_answer: finalAnswerTool,
	rag_graph_search: ragGraphSearchTool,
	mock_rag_graph_search: mockRagGraphSearchTool,
};

export const DETERMINISTIC_TOOL_MAP: Record<DeterministicAgentTrigger, Tool> = {
	[DeterministicAgentTrigger.ABORT]: finalAnswerTool,
	[DeterministicAgentTrigger.RAG_GRAPH_SEARCH]: ragGraphSearchTool,
};

export const TOOL_STATE_BINDINGS: Record<string, ToolStateBinding> = {
	rag_graph_search: {
		stateFields: [
			ToolBindingKeys.TOP_K,
			ToolBindingKeys.EMBEDDING_MODEL_NAME,
			ToolBindingKeys.INDEX_NAME,
			ToolBindingKeys.CHAT_ID,
		],
	},
};
