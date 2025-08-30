import type { Meta, StoryObj } from "@storybook/react";
import { HeroCTA } from "./heroCTA";

const meta: Meta<typeof HeroCTA> = {
	title: "Molecules/HeroCTA",
	component: HeroCTA,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		text: {
			control: { type: "text" },
		},
		middleScreenId: {
			control: { type: "text" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: "Get Started",
		middleScreenId: "middle",
	},
};

export const LongText: Story = {
	args: {
		text: "Learn More About Our Services",
		middleScreenId: "services",
	},
};

export const ShortText: Story = {
	args: {
		text: "Go",
		middleScreenId: "next",
	},
};
