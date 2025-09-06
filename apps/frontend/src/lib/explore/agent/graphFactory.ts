import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PromptValues } from "@/lib/explore/constants";
import { AgentGraphError } from "@/lib/explore/errors";
import {
	DEFAULT_FORMATTER_MAP,
	DEFAULT_LLM_MAP,
	DEFAULT_TOOL_MAP,
} from "@/lib/explore/maps";
import { finalAnswerTool } from "@/lib/explore/tools/finalAnswerTool";
import type {
	AgentConfig,
	AnswerFormatter,
	GraphFactory,
	GraphFactoryResult,
	InjectedMaps,
	Tool,
	ToolName,
} from "@/lib/explore/types";

export class AgentGraphFactory implements GraphFactory {
	private readonly toolMap: Record<ToolName, Tool>;
	private readonly llmMap: Record<string, (...args: any[]) => any>;
	private readonly formatterMap: Record<string, AnswerFormatter>;
	private readonly config: AgentConfig;

	constructor(config: AgentConfig, injectedMaps: Partial<InjectedMaps> = {}) {
		this.toolMap = { ...DEFAULT_TOOL_MAP, ...injectedMaps.toolMap };
		this.llmMap = { ...DEFAULT_LLM_MAP, ...injectedMaps.llmMap };
		this.formatterMap = {
			...DEFAULT_FORMATTER_MAP,
			...injectedMaps.formatterMap,
		};
		this.config = config;
	}

	execute(): GraphFactoryResult {
		const tools: Tool[] = [finalAnswerTool];

		for (const tool of this.config.tools) {
			const toolFn = this.toolMap[tool.name as ToolName];
			if (!toolFn) {
				throw new AgentGraphError(
					`Tool not found: ${tool.name}. The tool must be one of: ${Object.keys(this.toolMap).join(", ")}`,
				);
			}
			tools.push(toolFn);
		}
		const [llmConfig] = this.config.llms;
		if (!llmConfig) {
			throw new AgentGraphError("No LLM configuration provided");
		}
		const llmFn = this.llmMap[llmConfig.provider];
		if (!llmFn) {
			throw new AgentGraphError(
				`LLM not found: ${llmConfig.provider}. The LLM provider must be one of: ${Object.keys(this.llmMap).join(", ")}`,
			);
		}

		const answerFormatterConfig = this.config.answerFormatters[0];
		if (!answerFormatterConfig) {
			throw new AgentGraphError("No answer formatter configuration provided");
		}
		const answerFormatter = this.formatterMap[answerFormatterConfig.name];
		if (!answerFormatter) {
			throw new AgentGraphError(
				`Answer formatter not found: ${answerFormatterConfig.name}. The answer formatter must be one of: ${Object.keys(this.formatterMap).join(", ")}`,
			);
		}

		const prompt = ChatPromptTemplate.fromMessages([
			[PromptValues.PROMPT_SYSTEMT_KEY, this.config.systemPrompt],
			[PromptValues.PROMPT_SYSTEMT_KEY, PromptValues.PROMPT_CHAT_HISTORY_VALUE],
			[PromptValues.PROMPT_USER_KEY, PromptValues.PROMPT_USER_VALUE],
			[
				PromptValues.PROMPT_ASSISSTANT_KEY,
				PromptValues.PROMPT_ASSISSTANT_VALUE,
			],
		]);

		const llm = llmFn({ ...llmConfig.providerArgs });
		return {
			prompt,
			llm,
			answerFormatter,
			tools,
		};
	}
}
