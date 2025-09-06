import { ChatOpenAI } from "@langchain/openai";
import { AgentGraphError } from "@/lib/explore/errors";

interface OpenAiLLMArgs {
	model: string;
	temperature: number;
}

export const getOpenAiLLM = (args: OpenAiLLMArgs) => {
	if (args.temperature < 0 || args.temperature > 1) {
		throw new AgentGraphError("Temperature must be between 0 and 1");
	}
	const llm = new ChatOpenAI({
		...args,
		apiKey: process.env.OPENAI_API_KEY,
	});
	return llm;
};
