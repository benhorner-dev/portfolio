import type { Meta, StoryObj } from "@storybook/react";
import { TypingIndicator } from "./typingIndicator";

const meta: Meta<typeof TypingIndicator> = {
	title: "Molecules/TypingIndicator",
	component: TypingIndicator,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
