import type { ChatMessage, ChatService } from "./chatService";

export class MockChatService implements ChatService {
	constructor(private delay: number = 3000) {}

	private createMockBotResponse(): ChatMessage {
		return {
			id: (Date.now() + 1).toString(),
			text: "Thanks for your message! I'm currently working on implementing the full chat functionality. This is a placeholder response - soon you'll be able to have real conversations with me about my work!",
			isUser: false,
			timestamp: new Date(),
			quickReplies: [
				"Tell me about your projects",
				"What technologies do you use?",
				"What's your experience level?",
			],
		};
	}

	sendMessage(_: string, onResponse: (response: ChatMessage) => void): void {
		setTimeout(() => {
			const response = this.createMockBotResponse();
			onResponse(response);
		}, this.delay);
	}
}
