import type { Meta, StoryObj } from "@storybook/react";
import { LogoButton } from "./logoButton";

const meta: Meta<typeof LogoButton> = {
	title: "Atoms/LogoButton",
	component: LogoButton,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		href: {
			control: { type: "text" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		href: "#home",
	},
};

export const WithCustomHref: Story = {
	args: {
		href: "/dashboard",
	},
};

export const WithHashLink: Story = {
	args: {
		href: "#section1",
	},
};
