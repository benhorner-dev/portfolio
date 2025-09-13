import type { Meta, StoryObj } from "@storybook/react";
import { SocialLink } from "./socialLink";

const meta: Meta<typeof SocialLink> = {
	title: "Atoms/SocialLink",
	component: SocialLink,
	parameters: {
		layout: "centered",
		nextjs: {
			appDirectory: true,
		},
	},
	tags: ["autodocs"],
	argTypes: {
		href: {
			control: { type: "text" },
		},
		alt: {
			control: { type: "text" },
		},
		src: {
			control: { type: "text" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		href: "https://github.com",
		alt: "GitHub",
		src: "/images/github.png",
	},
};
