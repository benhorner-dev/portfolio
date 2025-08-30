import { create } from "zustand";

interface Message {
	id: string;
	text: string;
	isUser: boolean;
	timestamp: Date;
	quickReplies?: string[];
}

interface ChatState {
	messages: Message[];
	inputValue: string;
	isTyping: boolean;

	setInputValue: (value: string) => void;
	addMessage: (message: Message) => void;
	setIsTyping: (typing: boolean) => void;
	clearInput: () => void;
	resetChat: () => void;
}

const initialMessages: Message[] = [
	{
		id: "1",
		text: "Hi! I'm Ben. Feel free to ask me anything about my projects, skills, or experience. What would you like to know?",
		isUser: false,
		timestamp: new Date(),
		quickReplies: [
			"Tell me about your projects",
			"What technologies do you use?",
			"What's your experience level?",
		],
	},
];

export const useChatStore = create<ChatState>((set) => ({
	messages: initialMessages,
	inputValue: "",
	isTyping: false,

	setInputValue: (value) => set({ inputValue: value }),
	addMessage: (message) =>
		set((state) => ({
			messages: [...state.messages, message],
		})),
	setIsTyping: (typing) => set({ isTyping: typing }),
	clearInput: () => set({ inputValue: "" }),
	resetChat: () =>
		set({
			messages: initialMessages,
			inputValue: "",
			isTyping: false,
		}),
}));
