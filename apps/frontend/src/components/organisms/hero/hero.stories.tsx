import type { Meta, StoryObj } from "@storybook/react";
import { TypographyH1 } from "@/components/atoms/h1";
import { TypographyP } from "@/components/atoms/p";
import { HeroCTA } from "@/components/molecules/heroCTA";
import { Hero } from "./hero";

const meta: Meta<typeof Hero> = {
	title: "Organisms/Hero",
	component: Hero,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		header: {
			control: { type: "object" },
		},
		body: {
			control: { type: "object" },
		},
		cta: {
			control: { type: "object" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		header: <TypographyH1 text="Welcome to My Portfolio" />,
		body: (
			<TypographyP text="I'm a passionate developer creating amazing digital experiences." />
		),
		cta: <HeroCTA text="View My Work" middleScreenId="portfolio" />,
	},
};

export const WithLongContent: Story = {
	args: {
		header: <TypographyH1 text="Building the Future of Digital Innovation" />,
		body: (
			<TypographyP text="With over a decade of experience in software development, I specialize in creating cutting-edge web applications, mobile solutions, and digital platforms that drive business growth and user engagement. My passion lies in turning complex problems into elegant, user-friendly solutions." />
		),
		cta: <HeroCTA text="Let's Collaborate" middleScreenId="contact" />,
	},
};

export const WithShortContent: Story = {
	args: {
		header: <TypographyH1 text="Hi, I'm Ben" />,
		body: <TypographyP text="Developer & Designer" />,
		cta: <HeroCTA text="Start" middleScreenId="next" />,
	},
};
