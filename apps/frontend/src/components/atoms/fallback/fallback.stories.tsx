import type { Meta, StoryObj } from "@storybook/react";
import { Fallback } from "./fallback";

const meta: Meta<typeof Fallback> = {
	title: "Atoms/ChatFallback",
	component: Fallback,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDarkTheme: Story = {
	parameters: {
		backgrounds: {
			default: "dark",
		},
	},
};

export const WithCustomBackground: Story = {
	parameters: {
		backgrounds: {
			default: "gradient",
			values: [
				{
					name: "gradient",
					value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
				},
			],
		},
	},
};
