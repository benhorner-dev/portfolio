import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/atoms/button";
import { TypographyH2 } from "@/components/atoms/h2";
import { TypographyP } from "@/components/atoms/p";
import { ChatHeader } from "@/components/molecules/chatHeader";
import { LoginOverlay } from "@/components/molecules/loginOverlay";
import { DisabledChat } from "@/components/organisms/disabledChat";

const meta: Meta<typeof DisabledChat> = {
	title: "Organisms/DisabledChat",
	component: DisabledChat,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A disabled chat interface that displays random placeholder messages and requires authentication to interact. The component shows a login overlay and disables all input functionality.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		header: {
			control: { type: "object" },
			description: "The chat header component with title and subtitle",
		},
		placeholderTexts: {
			control: { type: "object" },
			description: "Placeholder text configuration for the input field",
		},
		overlay: {
			control: { type: "object" },
			description: "The login overlay component that appears over the chat",
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
				subtitle={<TypographyP text="Please log in to start chatting" />}
			/>
		),
		placeholderTexts: {
			default: "Type your message here...",
			thinking: "Thinking...",
			error: "Something went wrong",
		},
		overlay: (
			<LoginOverlay
				title={<TypographyH2 text="Authentication Required" />}
				description={
					<TypographyP text="Please log in to access the chat feature and start a conversation with our support team." />
				}
				loginButton={
					<Button variant="default" size="lg">
						Sign In to Chat
					</Button>
				}
			/>
		),
	},
};

export const WithCustomPlaceholders: Story = {
	args: {
		header: (
			<ChatHeader
				title={<TypographyH2 text="Customer Service" />}
				subtitle={<TypographyP text="Get help from our support team" />}
			/>
		),
		placeholderTexts: {
			default: "Ask us anything...",
			thinking: "Agent is typing...",
			error: "Connection lost",
		},
		overlay: (
			<LoginOverlay
				title={<TypographyH2 text="Login Required" />}
				description={
					<TypographyP text="Sign in to your account to start chatting with our customer service representatives." />
				}
				loginButton={
					<Button variant="default" size="lg">
						Login to Continue
					</Button>
				}
			/>
		),
	},
};

export const WithLongHeader: Story = {
	args: {
		header: (
			<ChatHeader
				title={<TypographyH2 text="Technical Support Chat" />}
				subtitle={
					<TypographyP text="Get help with technical issues, product questions, or general inquiries. Our support team is available 24/7 to assist you with any problems you may encounter." />
				}
			/>
		),
		placeholderTexts: {
			default: "Describe your technical issue here...",
			thinking: "Support agent is analyzing your request...",
			error: "Unable to connect to support",
		},
		overlay: (
			<LoginOverlay
				title={<TypographyH2 text="Account Verification Needed" />}
				description={
					<TypographyP text="To access our technical support chat, please verify your account credentials. This helps us provide personalized assistance and maintain security." />
				}
				loginButton={
					<Button variant="default" size="lg">
						Verify Account
					</Button>
				}
			/>
		),
	},
};

export const WithMinimalOverlay: Story = {
	args: {
		header: (
			<ChatHeader
				title={<TypographyH2 text="Quick Help" />}
				subtitle={<TypographyP text="Need assistance?" />}
			/>
		),
		placeholderTexts: {
			default: "Type here...",
			thinking: "Thinking...",
			error: "Error",
		},
		overlay: (
			<LoginOverlay
				title={<TypographyH2 text="Login" />}
				description={<TypographyP text="Sign in to chat" />}
				loginButton={
					<Button variant="default" size="md">
						Sign In
					</Button>
				}
			/>
		),
	},
};

export const WithDifferentButtonStyle: Story = {
	args: {
		header: (
			<ChatHeader
				title={<TypographyH2 text="Premium Support" />}
				subtitle={<TypographyP text="Exclusive chat for premium members" />}
			/>
		),
		placeholderTexts: {
			default: "Message our premium support team...",
			thinking: "Premium agent is responding...",
			error: "Premium support unavailable",
		},
		overlay: (
			<LoginOverlay
				title={<TypographyH2 text="Premium Access Required" />}
				description={
					<TypographyP text="This chat is exclusively for premium members. Upgrade your account to access priority support and exclusive features." />
				}
				loginButton={
					<Button variant="secondary" size="lg">
						Upgrade to Premium
					</Button>
				}
			/>
		),
	},
};

export const WithErrorState: Story = {
	args: {
		header: (
			<ChatHeader
				title={<TypographyH2 text="Support Chat" />}
				subtitle={<TypographyP text="Currently experiencing issues" />}
			/>
		),
		placeholderTexts: {
			default: "Chat temporarily unavailable...",
			thinking: "System is recovering...",
			error: "Service temporarily down",
		},
		overlay: (
			<LoginOverlay
				title={<TypographyH2 text="Service Unavailable" />}
				description={
					<TypographyP text="We're currently experiencing technical difficulties. Please try again later or contact us through alternative channels." />
				}
				loginButton={
					<Button variant="destructive" size="lg">
						Try Again Later
					</Button>
				}
			/>
		),
	},
};
