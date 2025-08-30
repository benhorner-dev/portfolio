import type { Meta, StoryObj } from "@storybook/react";
import { TypographyH1 } from "./h1";

const meta: Meta<typeof TypographyH1> = {
	title: "Atoms/Typography/H1",
	component: TypographyH1,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Main heading component for page titles and primary content headers.",
			},
		},
	},
	argTypes: {
		text: {
			control: "text",
			description: "The text content to display in the heading",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: "Main Page Heading",
	},
};

export const LongText: Story = {
	args: {
		text: "This is a very long heading that demonstrates how the component handles extended text content",
	},
};

export const ShortText: Story = {
	args: {
		text: "Hi",
	},
};

export const WithSpecialCharacters: Story = {
	args: {
		text: "Heading with Special Chars: @#$%^&*()",
	},
};
