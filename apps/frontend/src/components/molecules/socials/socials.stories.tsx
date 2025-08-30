import type { Meta, StoryObj } from "@storybook/react";
import { SocialLink } from "@/components/atoms/socialLink";
import { Socials } from "./socials";

const meta: Meta<typeof Socials> = {
	title: "Molecules/Socials",
	component: Socials,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		links: {
			control: { type: "object" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		links: [
			<SocialLink
				key="github"
				href="https://github.com"
				alt="GitHub"
				src="/images/github.png"
			/>,
		],
	},
};

export const SingleSocial: Story = {
	args: {
		links: [
			<SocialLink
				key="github"
				href="https://github.com"
				alt="GitHub"
				src="/images/github.png"
			/>,
		],
	},
};

export const MultipleSocials: Story = {
	args: {
		links: [
			<SocialLink
				key="github"
				href="https://github.com"
				alt="GitHub"
				src="/images/github.png"
			/>,
			<SocialLink
				key="github"
				href="https://github.com"
				alt="GitHub"
				src="/images/github.png"
			/>,
		],
	},
};
