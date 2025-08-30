import type { Meta, StoryObj } from "@storybook/react";
import { TypographyP } from "./p";

const meta: Meta<typeof TypographyP> = {
	title: "Atoms/Typography/Paragraph",
	component: TypographyP,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Standard paragraph component for body text and content paragraphs.",
			},
		},
	},
	argTypes: {
		text: {
			control: "text",
			description: "The text content to display in the paragraph",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: "This is a standard paragraph of text that demonstrates the typical usage of the TypographyP component.",
	},
};

export const LongText: Story = {
	args: {
		text: "This is a very long paragraph that demonstrates how the component handles extended text content. It includes multiple sentences and shows how the component behaves with substantial amounts of text that might wrap across multiple lines in the user interface.",
	},
};

export const ShortText: Story = {
	args: {
		text: "Short text.",
	},
};

export const WithSpecialCharacters: Story = {
	args: {
		text: "Paragraph with special characters: @#$%^&*() and numbers 1234567890",
	},
};
