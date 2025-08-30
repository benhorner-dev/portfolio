import type { Meta, StoryObj } from "@storybook/react";
import { ErrorFallback } from "./errorFallback";

const meta: Meta<typeof ErrorFallback> = {
	title: "Atoms/ChatErrorFallback",
	component: ErrorFallback,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		error: {
			control: { type: "object" },
		},
		componentStack: {
			control: { type: "text" },
		},
		eventId: {
			control: { type: "text" },
		},
		resetError: {
			action: "resetError",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		error: new Error("Failed to load chat component"),
		componentStack: "ChatWrapper > Chat > Message",
		eventId: "error-123",
		resetError: () => console.log("Reset clicked"),
	},
};

export const WithLongErrorMessage: Story = {
	args: {
		error: new Error(
			"This is a very long error message that demonstrates how the component handles lengthy error text and ensures proper layout and readability across different error message lengths",
		),
		componentStack: "ChatWrapper > Chat > Message > QuickReply",
		eventId: "error-456",
		resetError: () => console.log("Reset clicked"),
	},
};

export const WithNonErrorObject: Story = {
	args: {
		error: "String error message",
		componentStack: "ChatWrapper > Chat",
		eventId: "error-789",
		resetError: () => console.log("Reset clicked"),
	},
};
