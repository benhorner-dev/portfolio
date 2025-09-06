/* c8 ignore start */

import { RunnableLambda } from "@langchain/core/runnables";
import { AgentGraphError } from "@/lib/explore/errors";

interface FakeLLMArgs {
	response: string | undefined;
	model?: string;
	temperature?: number;
	defaultToolName?: string;
}

export const getMockLLM = (
	args: FakeLLMArgs = {
		response: undefined,
	},
) => {
	if (args.temperature && (args.temperature < 0 || args.temperature > 1)) {
		throw new AgentGraphError("Temperature must be between 0 and 1");
	}

	const mockRunnable = RunnableLambda.from(async (input: any) => {
		await new Promise((resolve) => setTimeout(resolve, 5000));

		if (!args.response) {
			return {
				content: "No arguments provided to mock LLM",
				tool_calls: [
					{
						name: "final_answer",
						args: {
							answer: "This is a mock response from the LLM.",
							researchSteps: "",
							suggestQuestionOne: "test question one",
							suggestQuestionTwo: "test question two",
							suggestQuestionThree: "test question three",
						},
					},
				],
			};
		}
		const tool_call = JSON.parse(args.response);
		const parsedInput = `Input received by LLM:\n${JSON.stringify(
			input.lc_kwargs?.messages,
		)?.replace(/\\+/g, "")}`;
		tool_call.args.researchSteps = parsedInput;
		return {
			content: "LLm response:",
			tool_calls: [tool_call],
		};
	}) as any;

	mockRunnable.bindTools = (tools: any[], options: any = {}) => {
		return mockRunnable;
	};

	mockRunnable.withConfig = (config: any) => {
		return mockRunnable;
	};

	return mockRunnable;
};

/* c8 ignore stop */
