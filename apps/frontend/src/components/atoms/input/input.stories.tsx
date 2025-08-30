import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
	title: "Atoms/Input",
	component: Input,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: { type: "select" },
			options: ["default", "error", "success"],
		},
		inputSize: {
			control: { type: "select" },
			options: ["default", "sm", "lg"],
		},
		type: {
			control: { type: "select" },
			options: ["text", "email", "password", "number", "search"],
		},
		placeholder: {
			control: { type: "text" },
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
		placeholder: "Enter text here...",
	},
};

export const WithValue: Story = {
	args: {
		value: "Sample text",
		placeholder: "Enter text here...",
	},
};

export const Email: Story = {
	args: {
		type: "email",
		placeholder: "Enter your email...",
	},
};

export const Password: Story = {
	args: {
		type: "password",
		placeholder: "Enter your password...",
	},
};

export const Search: Story = {
	args: {
		type: "search",
		placeholder: "Search...",
	},
};

export const Small: Story = {
	args: {
		inputSize: "sm",
		placeholder: "Small input",
	},
};

export const Large: Story = {
	args: {
		inputSize: "lg",
		placeholder: "Large input",
	},
};

export const ErrorState: Story = {
	args: {
		variant: "error",
		placeholder: "Error state",
		value: "Invalid input",
	},
};

export const Success: Story = {
	args: {
		variant: "success",
		placeholder: "Success state",
		value: "Valid input",
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		placeholder: "Disabled input",
		value: "Cannot edit",
	},
};

export const WithLabel: Story = {
	args: {
		placeholder: "Enter text here...",
		"aria-label": "Input with label",
	},
};
