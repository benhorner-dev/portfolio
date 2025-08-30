import type { Meta, StoryObj } from "@storybook/react";
import { Message } from "./message";

const meta: Meta<typeof Message> = {
	title: "Molecules/Message",
	component: Message,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		msgId: {
			control: { type: "text" },
		},
		text: {
			control: { type: "text" },
		},
		isUser: {
			control: { type: "boolean" },
		},
		quickReplies: {
			control: { type: "object" },
		},
		isTyping: {
			control: { type: "boolean" },
		},
		onQuickReply: {
			action: "quickReply",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UserMessage: Story = {
	args: {
		msgId: "1",
		text: "Hello, how can you help me?",
		isUser: true,
		quickReplies: [],
		isTyping: false,
		onQuickReply: (reply: string) => console.log("Quick reply:", reply),
	},
};

export const BotMessage: Story = {
	args: {
		msgId: "2",
		text: "Hi! I'm here to help you with any questions you might have.",
		isUser: false,
		quickReplies: [],
		isTyping: false,
		onQuickReply: (reply: string) => console.log("Quick reply:", reply),
	},
};

export const WithQuickReplies: Story = {
	args: {
		msgId: "3",
		text: "What would you like to know about?",
		isUser: false,
		quickReplies: ["Product Info", "Pricing", "Support", "Contact"],
		isTyping: false,
		onQuickReply: (reply: string) => console.log("Quick reply:", reply),
	},
};

export const LongMessage: Story = {
	args: {
		msgId: "4",
		text: "This is a very long message that demonstrates how the component handles extended text content. It includes multiple sentences to show the full range of message capabilities and text wrapping behavior.",
		isUser: false,
		quickReplies: [],
		isTyping: false,
		onQuickReply: (reply: string) => console.log("Quick reply:", reply),
	},
};

export const TypingMessage: Story = {
	args: {
		msgId: "5",
		text: "I'm thinking...",
		isUser: false,
		quickReplies: [],
		isTyping: true,
		onQuickReply: (reply: string) => console.log("Quick reply:", reply),
	},
};
