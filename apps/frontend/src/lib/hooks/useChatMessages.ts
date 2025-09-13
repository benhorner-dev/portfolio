import { readStreamableValue } from "@ai-sdk/rsc";
import { useCallback } from "react";
import {
	checkDailyTokenCount,
	updateTokenCount,
} from "@/lib/explore/agent/tokenCount";
import { AgentGraphError } from "@/lib/explore/errors";
import type {
	AgentResponse,
	AgentServerAction,
	ChatMessage,
} from "@/lib/explore/types";
import { useChatStore } from "@/lib/stores/chatStore";
import { InterlocutorType } from "../explore/constants";
export const useChatMessages = (
	action: AgentServerAction,
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
		async (message: string) => {
			setIsTyping(true);
			if (!message.trim()) {
				throw new Error("Message input value is required");
			}
			const newMessage = {
				id: crypto.randomUUID(),
				content: null,
				type: InterlocutorType.AI,
				timestamp: new Date().toISOString(),
				thoughts: [],
				quickReplies: [],
				inputValue: message,
			} as ChatMessage;
			try {
				if (!chatId) {
					throw new AgentGraphError("Chat ID is required");
				}
				if (!config) {
					throw new AgentGraphError("Config is required");
				}
				const humanMessage = {
					id: crypto.randomUUID(),
					content: message,
					type: InterlocutorType.HUMAN,
					timestamp: new Date().toISOString(),
					thoughts: [],
					quickReplies: [],
				};
				useChatStore.getState().batchUpdate({
					messages: [...messages, humanMessage, newMessage],
					isTyping: true,
					scrollPosition: messagesContainerRef?.current?.scrollTop || 0,
				});

				const user = await checkDailyTokenCount(chatId);
				if (messagesContainerRef?.current) {
					const { setScrollPosition } = useChatStore.getState();
					setScrollPosition(messagesContainerRef.current.scrollTop);
				}

				setIsTyping(true);

				const response = await action(
					message,
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
				setIsTyping(false);
				await updateTokenCount(user, tokens);
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
			config,
			action,
			messagesContainerRef,
		],
	);

	return { messages, sendMessage };
};
