import { tool } from "@langchain/core/tools";
import { AgentGraphError } from "@/lib/explore/errors";
import {
	FinalAnswerConfigSchema,
	FinalAnswerSchema,
} from "@/lib/explore/schema";
import { getToolConfig } from "@/lib/explore/tools/utils";
import type { FinalAnswerArgs } from "@/lib/explore/types";
import { getLogger } from "@/lib/logger";

const logger = getLogger();

const TOOL_NAME = "final_answer";

export const finalAnswerTool = tool(
	async (props) => finalAnswer(props as FinalAnswerArgs),
	{
		name: TOOL_NAME,
		description: (await getToolConfig(TOOL_NAME)).description,
		schema: FinalAnswerSchema,
	},
);

export const finalAnswer = async ({
	answer,
	researchSteps,
	suggestQuestionOne,
	suggestQuestionTwo,
	suggestQuestionThree,
}: FinalAnswerArgs) => {
	const config = (await getToolConfig(TOOL_NAME)).config;
	const parsedConfig = FinalAnswerConfigSchema.parse(config);
	try {
		const result = JSON.stringify(
			{
				answer,
				researchSteps,
				courseLinks: [
					suggestQuestionOne,
					suggestQuestionTwo,
					suggestQuestionThree,
				],
			},
			null,
			parsedConfig.jsonSpace,
		);

		return result;
	} catch (error) {
		logger.error(parsedConfig.errorMsg, error);
		throw new AgentGraphError(`${parsedConfig.errorMsg} ${String(error)}`);
	}
};
