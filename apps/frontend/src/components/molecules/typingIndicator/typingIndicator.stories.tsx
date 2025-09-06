import type { Meta, StoryObj } from "@storybook/react";
import { InterlocutorType } from "@/lib/explore/constants";
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
	args: {
		message: {
			id: "typing",
			content: "",
			type: InterlocutorType.AI,
			timestamp: new Date().toISOString(),
			thoughts: [],
		},
	},
};
