import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { ChatInput } from "./chatInput";

const meta: Meta<typeof ChatInput> = {
	title: "Molecules/ChatInput",
	component: ChatInput,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		button: {
			control: { type: "object" },
		},
		input: {
			control: { type: "object" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		button: <Button>Send</Button>,
		input: <Input placeholder="Type your message..." />,
	},
};

export const WithCustomButton: Story = {
	args: {
		button: <Button variant="outline">Submit</Button>,
		input: <Input placeholder="Type your message..." />,
	},
};

export const WithCustomInput: Story = {
	args: {
		button: <Button>Send</Button>,
		input: <Input placeholder="Enter your thoughts..." variant="success" />,
	},
};
