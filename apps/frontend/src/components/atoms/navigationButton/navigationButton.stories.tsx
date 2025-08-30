import type { Meta, StoryObj } from "@storybook/react";
import { NavigationButton } from "./navigationButton";

const meta: Meta<typeof NavigationButton> = {
	title: "Atoms/NavigationButton",
	component: NavigationButton,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		href: {
			control: { type: "text" },
		},
		text: {
			control: { type: "text" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		href: "#about",
		text: "About",
	},
};

export const WithLongText: Story = {
	args: {
		href: "#contact",
		text: "Contact Us",
	},
};

export const WithShortText: Story = {
	args: {
		href: "#home",
		text: "Home",
	},
};

export const WithHashLink: Story = {
	args: {
		href: "#section1",
		text: "Section 1",
	},
};
