export interface ChatMessage {
	id: string;
	text: string;
	isUser: boolean;
	timestamp: Date;
	quickReplies?: string[];
}

export interface ChatService {
	sendMessage(text: string, onResponse: (response: ChatMessage) => void): void;
}
