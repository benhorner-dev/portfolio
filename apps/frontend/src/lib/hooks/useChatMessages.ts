import { readStreamableValue } from "@ai-sdk/rsc";
import { useCallback } from "react";
import { agent } from "@/lib/explore/agent";
import {
	checkDailyTokenCount,
	updateTokenCount,
} from "@/lib/explore/agent/tokenCount";
import { AgentGraphError } from "@/lib/explore/errors";
import type { AgentResponse, ChatMessage } from "@/lib/explore/types";
import { useChatStore } from "@/lib/stores/chatStore";
export const useChatMessages = (
	messagesContainerRef?: React.RefObject<HTMLDivElement | null>,
) => {
	const {
		messages,
		setIsTyping,
		updateMessage,
		updateThoughts,
		chatId,
		config,
	} = useChatStore();

	const sendMessage = useCallback(
		async (message: ChatMessage) => {
			const newMessage = { ...message };
			try {
				if (!chatId) {
					throw new AgentGraphError("Chat ID is required");
				}
				if (!config) {
					throw new AgentGraphError("Config is required");
				}
				const user = await checkDailyTokenCount(chatId);

				if (messagesContainerRef?.current) {
					const { setScrollPosition } = useChatStore.getState();
					setScrollPosition(messagesContainerRef.current.scrollTop);
				}

				setIsTyping(true);
				if (!message.inputValue) {
					throw new Error("Message input value is required");
				}
				const response = await agent(
					message.inputValue,
					config,
					messages,
					String(chatId),
				);
				let tokens = 0;
				for await (const streamIteration of readStreamableValue(
					response,
				) as AsyncIterable<AgentResponse>) {
					if (streamIteration?.error) {
						throw streamIteration.error;
					}
					if (streamIteration?.courseLinks) {
						newMessage.quickReplies = streamIteration.courseLinks;
					}
					if (streamIteration?.scratchPad) {
						newMessage.thoughts.push(streamIteration.scratchPad);

						updateThoughts(newMessage.id, newMessage.thoughts);
					}
					if (streamIteration?.answer) {
						newMessage.content = streamIteration.answer;
					}
					if (streamIteration?.totalTokens) {
						tokens += streamIteration.totalTokens;
					}
					updateMessage(newMessage.id, {
						...newMessage,
					});
				}
				await updateTokenCount(user, tokens);
				setIsTyping(false);
			} catch (error) {
				setIsTyping(false);
				if ((error as Error)?.name.includes("UserFacingErrors")) {
					newMessage.content = (error as Error).message;
					updateMessage(newMessage.id, {
						...newMessage,
					});
					return;
				} else {
					throw error;
				}
			}
		},
		[
			messages,
			setIsTyping,
			updateMessage,
			updateThoughts,
			chatId,
			messagesContainerRef?.current,
			config,
		],
	);

	return { messages, sendMessage };
};
