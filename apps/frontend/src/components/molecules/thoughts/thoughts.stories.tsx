import type { Meta, StoryObj } from "@storybook/react";
import { InterlocutorType } from "@/lib/explore/constants";
import type { ChatMessage } from "@/lib/explore/types";
import { Thoughts } from "./thoughts";

const mockMessage: ChatMessage = {
	id: "story-message-1",
	content: "This is a sample message",
	type: InterlocutorType.AI,
	thoughts: [],
};

const meta: Meta<typeof Thoughts> = {
	title: "Molecules/Thoughts",
	component: Thoughts,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A collapsible thoughts component that displays AI reasoning or thought processes in an accordion format. Features a brain emoji trigger and styled thought items with bullet points.",
			},
		},
	},
	argTypes: {
		thoughts: {
			control: "object",
			description: "Array of thought strings to display",
		},
		message: {
			control: "object",
			description: "Chat message object containing metadata",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		thoughts: [
			"I need to analyze the user's question carefully",
			"Let me consider the different aspects of this problem",
			"The best approach would be to break this down into steps",
		],
		message: mockMessage,
	},
	render: (args) => (
		<div className="w-96 bg-slate-50 p-4 rounded-lg">
			<Thoughts {...args} />
		</div>
	),
};

export const SingleThought: Story = {
	args: {
		thoughts: ["This is a single thought or reasoning step"],
		message: mockMessage,
	},
	render: (args) => (
		<div className="w-96 bg-slate-50 p-4 rounded-lg">
			<Thoughts {...args} />
		</div>
	),
};

export const ManyThoughts: Story = {
	args: {
		thoughts: [
			"First, I'll gather all the relevant information",
			"Then I need to analyze the context and requirements",
			"I should consider potential edge cases or limitations",
			"Let me think about the best solution approach",
			"I'll need to validate my reasoning before proceeding",
			"Finally, I'll structure my response clearly and helpfully",
		],
		message: {
			...mockMessage,
			id: "story-message-many",
		},
	},
	render: (args) => (
		<div className="w-96 bg-slate-50 p-4 rounded-lg">
			<Thoughts {...args} />
		</div>
	),
};

export const EmptyThoughts: Story = {
	args: {
		thoughts: [],
		message: mockMessage,
	},
	render: (args) => (
		<div className="w-96 bg-slate-50 p-4 rounded-lg">
			<Thoughts {...args} />
		</div>
	),
};

export const LongThoughts: Story = {
	args: {
		thoughts: [
			"This is a much longer thought that demonstrates how the component handles extensive reasoning or detailed explanations that might span multiple lines and require more space to display properly",
			"Another lengthy consideration that explores complex topics in depth, showing how the component maintains readability even with substantial amounts of text content",
			"A final extended thought that tests the component's ability to gracefully handle verbose explanations while maintaining good visual hierarchy and user experience",
		],
		message: {
			...mockMessage,
			id: "story-message-long",
		},
	},
	render: (args) => (
		<div className="w-96 bg-slate-50 p-4 rounded-lg">
			<Thoughts {...args} />
		</div>
	),
};

export const InChatContext: Story = {
	args: {
		thoughts: [
			"I understand the user is asking about React components",
			"I should provide a comprehensive but accessible explanation",
			"Let me structure this to cover the key concepts clearly",
		],
		message: {
			...mockMessage,
			content: "Can you explain React components?",
			id: "story-message-chat",
		},
	},
	render: (args) => (
		<div className="max-w-md bg-white border rounded-lg shadow-sm p-4">
			<div className="mb-2">
				<div className="text-sm text-gray-600 mb-1">AI Assistant</div>
				<div className="text-gray-900">
					React components are reusable pieces of code that return JSX elements
					to describe what should appear on screen.
				</div>
			</div>
			<Thoughts {...args} />
		</div>
	),
};
