import type { Meta, StoryObj } from "@storybook/react";
import { TypographyH2 } from "@/components/atoms/h2";
import { TypographyP } from "@/components/atoms/p";
import { ChatHeader } from "@/components/molecules/chatHeader";
import { Chat } from "./chat";

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
