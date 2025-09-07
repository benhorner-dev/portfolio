import type { Meta, StoryObj } from "@storybook/react";
import { vi } from "vitest";
import { InterlocutorType } from "@/lib/explore/constants";
import { Message } from "./message";

vi.mock("@ai-sdk/rsc", () => ({
	readStreamableValue: vi.fn(),
	createStreamableValue: vi.fn(),
}));

vi.mock("@langchain/langgraph", () => ({
	StateGraph: vi.fn(),
	END: "END",
	START: "START",
}));

vi.mock("node:async_hooks", () => ({
	AsyncLocalStorage: vi.fn(() => ({
		run: vi.fn(),
		getStore: vi.fn(),
	})),
}));

vi.mock("redis", () => ({
	createClient: vi.fn(() => ({
		connect: vi.fn(),
		disconnect: vi.fn(),
		get: vi.fn(),
		set: vi.fn(),
	})),
}));

vi.mock("@neondatabase/serverless", () => ({
	neon: vi.fn(() => ({
		sql: vi.fn(),
	})),
}));

globalThis.Buffer = globalThis.Buffer || {
	from: vi.fn(),
	alloc: vi.fn(),
	isBuffer: vi.fn(() => false),
};

vi.mock("@/lib/explore/agent", () => ({
	agent: vi.fn(),
}));

vi.mock("@/lib/hooks/useChatMessages", () => ({
	useChatMessages: vi.fn(() => ({
		sendMessage: vi.fn(),
	})),
}));

const mockAction = vi.fn().mockResolvedValue({
	value: {
		content: "Mock response",
		thoughts: [],
		quickReplies: [],
	},
});

const meta: Meta<typeof Message> = {
	title: "Molecules/Message",
	component: Message,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UserMessage: Story = {
	args: {
		message: {
			id: "1",
			content: "Hello, how can you help me?",
			type: InterlocutorType.HUMAN,
			timestamp: new Date().toISOString(),
			thoughts: [],
			quickReplies: [],
		},
		action: mockAction,
	},
};

export const BotMessage: Story = {
	args: {
		message: {
			id: "2",
			content: "Hi! I'm here to help you with any questions you might have.",
			type: InterlocutorType.AI,
			timestamp: new Date().toISOString(),
			thoughts: [],
			quickReplies: [],
		},
		action: mockAction,
	},
};

export const WithQuickReplies: Story = {
	args: {
		message: {
			id: "3",
			content: "What would you like to know about?",
			type: InterlocutorType.AI,
			timestamp: new Date().toISOString(),
			thoughts: [],
			quickReplies: ["Product Info", "Pricing", "Support", "Contact"],
		},
		action: mockAction,
	},
};

export const LongMessage: Story = {
	args: {
		message: {
			id: "4",
			content:
				"This is a very long message that demonstrates how the component handles extended text content. It includes multiple sentences to show the full range of message capabilities and text wrapping behavior.",
			type: InterlocutorType.AI,
			timestamp: new Date().toISOString(),
			thoughts: [],
			quickReplies: [],
		},
		action: mockAction,
	},
};

export const TypingMessage: Story = {
	args: {
		message: {
			id: "5",
			content: null,
			type: InterlocutorType.AI,
			timestamp: new Date().toISOString(),
			thoughts: [],
			quickReplies: [],
		},
		action: mockAction,
	},
};
