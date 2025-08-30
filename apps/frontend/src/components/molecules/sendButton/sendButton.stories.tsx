import type { Meta, StoryObj } from "@storybook/react";
import { SendButton } from "./sendButton";

const meta: Meta<typeof SendButton> = {
	title: "Molecules/SendButton",
	component: SendButton,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		onClick: {
			action: "clicked",
		},
		disabled: {
			control: { type: "boolean" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onClick: () => console.log("Send button clicked"),
		disabled: false,
	},
};

export const Disabled: Story = {
	args: {
		onClick: () => console.log("Send button clicked"),
		disabled: true,
	},
};
