import type { Meta, StoryObj } from "@storybook/react";
import { vi } from "vitest";
import { TypographyH2 } from "@/components/atoms/h2";
import { TypographyP } from "@/components/atoms/p";
import { ChatHeader } from "@/components/molecules/chatHeader";
import { Chat } from "./chat";

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

globalThis.Buffer = globalThis.Buffer || {
	from: vi.fn(),
	alloc: vi.fn(),
	isBuffer: vi.fn(() => false),
};

vi.mock("@/lib/hooks/useChatMessages", () => ({
	useChatMessages: vi.fn(() => ({
		messages: [],
		sendMessage: vi.fn(),
	})),
}));

const meta: Meta<typeof Chat> = {
	title: "Organisms/Chat",
	component: Chat,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		header: {
			control: { type: "object" },
		},
		placeholderTexts: {
			control: { type: "object" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		header: (
			<ChatHeader
				title={<TypographyH2 text="Chat Support" />}
				subtitle={<TypographyP text="How can we help you today?" />}
			/>
		),
		placeholderTexts: {
			default: "Type your message here...",
			typing: "Ben is typing...",
		},
	},
};

export const WithCustomPlaceholders: Story = {
	args: {
		header: (
			<ChatHeader
				title={<TypographyH2 text="Customer Service" />}
				subtitle={<TypographyP text="Our team is here to assist you" />}
			/>
		),
		placeholderTexts: {
			default: "Ask us anything...",
			typing: "Agent is responding...",
		},
	},
};

export const WithLongHeader: Story = {
	args: {
		header: (
			<ChatHeader
				title={<TypographyH2 text="Technical Support Chat" />}
				subtitle={
					<TypographyP text="Get help with technical issues, product questions, or general inquiries. Our support team is available 24/7 to assist you." />
				}
			/>
		),
		placeholderTexts: {
			default: "Describe your issue here...",
			typing: "Support agent is typing...",
		},
	},
};
