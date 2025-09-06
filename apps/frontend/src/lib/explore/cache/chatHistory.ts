"use server";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { InterlocutorType } from "@/lib/explore/constants";
import { getCache } from "./cache";

export const writeChatHistory = async (
	chatId: string,
	mostRecentAiMessage: string,
	mostRecentUserMessage: string,
) => {
	const cache = await getCache();
	const cacheKey = `chat_summary_${chatId}`;

	const existingHistory = (await cache.get(cacheKey)) || "";

	const currentInteraction = `Existing History:
    ${existingHistory}
    First New Message:
    type:${InterlocutorType.HUMAN}, content: ${mostRecentUserMessage}
    Second New Message:
    type:${InterlocutorType.AI}, content: ${mostRecentAiMessage}`;
	const summary = await summarizeChatHistory(currentInteraction);

	cache.set(cacheKey, summary);
};

export const readCacheHistory = async (chatId: string): Promise<string> => {
	const cache = await getCache();
	const cacheKey = `chat_summary_${chatId}`;
	const existingHistory = (await cache.get(cacheKey)) || "";
	return existingHistory;
};

const summarizeChatHistory = async (
	formattedHistory: string,
): Promise<string> => {
	const llm = new ChatOpenAI({
		modelName: "gpt-4o-mini",
		temperature: 0,
		openAIApiKey: process.env.OPENAI_API_KEY,
	});

	const systemPrompt = `You are a helpful assistant that summarizes chat conversations.
Create a concise but comprehensive summary that captures:
- Main topics discussed
- Key decisions or conclusions reached
- Important questions asked
- Overall context and tone of the conversation

Keep the summary clear and well-organized. Aim for 2-4 paragraphs depending on conversation length.`;

	const messages = [
		new SystemMessage(systemPrompt),
		new HumanMessage(
			`Please summarize the following chat conversation:\n\n${formattedHistory}`,
		),
	];

	const response = await llm.invoke(messages);
	return response.content as string;
};
