import { OpenAIEmbeddings } from "@langchain/openai";
import { AgentGraphError } from "@/lib/explore/errors";

const EMBEDDING_STRATEGIES = {
	"text-embedding-3-small": "openai",
};

export const getEmbeddings = async (embeddingModelName: string) => {
	const embeddingStrategy =
		EMBEDDING_STRATEGIES[
			embeddingModelName as keyof typeof EMBEDDING_STRATEGIES
		];

	switch (embeddingStrategy) {
		case "openai":
			if (!process.env.OPENAI_API_KEY) {
				throw new Error("OPENAI_API_KEY environment variable required");
			}
			return new OpenAIEmbeddings({
				openAIApiKey: process.env.OPENAI_API_KEY,
				modelName: embeddingModelName,
				stripNewLines: true,
			});
		default:
			throw new AgentGraphError(
				`Embedding strategy not supported: ${embeddingModelName}. Supported strategies: ${Object.keys(
					EMBEDDING_STRATEGIES,
				).join(", ")}`,
			);
	}
};
