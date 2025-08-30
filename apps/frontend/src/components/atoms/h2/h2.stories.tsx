import type { Meta, StoryObj } from "@storybook/react";
import { TypographyH2 } from "@/components/atoms/h2";

const meta: Meta<typeof TypographyH2> = {
	title: "Atoms/Typography/H2",
	component: TypographyH2,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Secondary heading component for section titles and content organization.",
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
		text: "Section",
	},
};

export const LongText: Story = {
	args: {
		text: "This is a very long section heading that demonstrates how the component handles extended text content",
	},
};

export const ShortText: Story = {
	args: {
		text: "Section",
	},
};

export const WithSpecialCharacters: Story = {
	args: {
		text: "Section with Special Chars: @#$%^&*()",
	},
};
