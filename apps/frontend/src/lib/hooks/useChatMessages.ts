import { useCallback } from "react";
import type { ChatMessage, ChatService } from "@/lib/services/chatService";
import { MockChatService } from "@/lib/services/mockChatService";
import { useChatStore } from "@/lib/stores/chatStore";

export const useChatMessages = (chatService: ChatService) => {
	const { messages, addMessage, setIsTyping } = useChatStore();

	const sendMessage = useCallback(
		(text: string) => {
			const userMessage: ChatMessage = {
				id: Date.now().toString(),
				text: text.trim(),
				isUser: true,
				timestamp: new Date(),
			};

			addMessage(userMessage);
			setIsTyping(true);

			chatService.sendMessage(text, (botResponse) => {
				addMessage(botResponse);
				setIsTyping(false);
			});
		},
		[addMessage, setIsTyping, chatService],
	);

	return { messages, sendMessage };
};

export const useMockChatMessages = () => {
	const mockService = new MockChatService();
	return useChatMessages(mockService);
};
