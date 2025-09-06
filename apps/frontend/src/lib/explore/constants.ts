import { Environment } from "@/lib/constants";

export enum DeterministicAgentTrigger {
	ABORT = "__ABORT__",
	RAG_GRAPH_SEARCH = "__RAG_GRAPH_SEARCH__",
}

export enum ExecutionType {
	PARALLEL = "parallel",
	SEQUENTIAL = "sequential",
}

export enum InterlocutorType {
	HUMAN = "human",
	AI = "ai",
}

export enum OracleValues {
	ORACLE = "oracle",
	FINAL_ANSWER = "final_answer",
	CHOICE_TO_FORCE_TOOL_USE = "any",
}

export enum PromptValues {
	PROMPT_SYSTEMT_KEY = "system",
	PROMPT_USER_KEY = "user",
	PROMPT_ASSISSTANT_KEY = "assistant",
	PROMPT_CHAT_HISTORY_KEY = "chat_history",
	PROMPT_USER_VALUE = "{input}",
	PROMPT_ASSISSTANT_VALUE = "scratchpad: {scratchpad}",
	PROMPT_CHAT_HISTORY_VALUE = "{chatHistory}",
}

export enum ReservedMethod {
	CONSTRUCTOR = "constructor",
	INSTRUMENT_METHODS = "instrumentMethods",
	GET_INSTRUMENTABLE_METHODS = "getInstrumentableMethods",
	IS_INSTRUMENTABLE_METHOD = "isInstrumentableMethod",
	IS_RESERVED_METHOD_NAME = "isReservedMethodName",
	WRAP_METHOD = "wrapMethod",
	HANDLE_METHOD_CALL = "handleMethodCall",
	HANDLE_SYNC_RESULT = "handleSyncResult",
	HANDLE_ASYNC_RESULT = "handleAsyncResult",
	HANDLE_ERROR = "handleError",
	CREATE_TRACED_CONTEXT = "createTracedContext",
	LOG_TRACE = "logTrace",
	LOG_ERROR = "logError",
}

export enum ToolBindingKeys {
	CHAT_ID = "chatId",
	TOP_K = "topK",
	EMBEDDING_MODEL_NAME = "embeddingModelName",
	INDEX_NAME = "indexName",
}

export enum TraceEvent {
	ENTER = "Enter",
	SUCCESS = "Success",
	ERROR = "Error",
	RE_RAISING = "Re-raising PipelineError",
}

export enum VectorDBMethod {
	CONNECT = "connect",
}

export const VERBOSE_LOGGING = process.env.NODE_ENV === Environment.PRODUCTION;
