import z from "zod";

const LLMConfigSchema = z.object({
	providerArgs: z.object({
		model: z.string().optional(),
		temperature: z.number().optional(),
		response: z.string().optional(),
	}),
	provider: z.string(),
});

export const ToolConfigSchema = z.object({
	name: z.string(),
	description: z.string(),
	config: z.record(z.string(), z.any()).nullish(),
});

const AnswerFormatterSchema = z.object({
	name: z.string(),
});

export const AgentConfigSchema = z.object({
	langsmithUrl: z.string(),
	systemPrompt: z.string(),
	defaultAgentActionLog: z.string(),
	llms: z.array(LLMConfigSchema),
	tools: z.array(ToolConfigSchema),
	initialTools: z.array(ToolConfigSchema),
	maxIntermediateSteps: z.number(),
	answerFormatters: z.array(AnswerFormatterSchema),
	defaultErrorMessage: z.string(),
	embeddingModelName: z.string(),
	vectorResultsTopK: z.number(),
	indexName: z.string(),
});

export const FinalAnswerSchema = z.object({
	answer: z
		.string()
		.describe(
			"The final answer to the user's question. Should be comprehensive and well-written.",
		),
	researchSteps: z
		.string()
		.describe(
			"A bullet point list explaining the steps that were taken to research and arrive at this answer",
		),
	suggestQuestionOne: z
		.string()
		.describe("A suggested first next question, must be unqiue"),
	suggestQuestionTwo: z
		.string()
		.describe("A suggested second next question, must be unqiue"),
	suggestQuestionThree: z
		.string()
		.describe("A suggested third next question, must be unqiue"),
});

export const ChatIdOnlySchema = z.object({
	chatId: z.string().describe("Key to fetch the user profile from cache"),
});

export const RagSearchSchema = z.object({
	chatId: z.string().describe("Key to fetch the user profile from cache"),
	query: z
		.string()
		.describe(
			'Natural language query to search for courses (e.g., "machine learning courses", "online business degrees", "hands-on programming")',
		),
	embeddingModelName: z
		.string()
		.describe("Embeddings model name used for generating query embeddings"),
	topK: z.number().describe("Number of top results to return"),
	indexName: z
		.string()
		.describe(
			'Name of the vector index to search (e.g., "courses", "articles")',
		),
});

export const RagGraphSearchSchema = RagSearchSchema.omit({ indexName: true });

export const RagSearchConfigSchema = z.object({
	courseTitle: z.string(),
	provider: z.string(),
	chunkType: z.string(),
	similarityScore: z.string(),
	contentPreview: z.string(),
	categories: z.string(),
	tags: z.string(),
	level: z.string(),
	deliveryModes: z.string(),
	subStringLength: z.number(),
});

export const FinalAnswerConfigSchema = z.object({
	jsonSpace: z.number(),
	errorMsg: z.string(),
});
