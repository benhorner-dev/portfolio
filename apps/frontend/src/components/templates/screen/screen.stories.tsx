import type { Meta, StoryObj } from "@storybook/react";
import { ScreenType } from "@/app/constants";
import { TypographyH1 } from "@/components/atoms/h1";
import { TypographyP } from "@/components/atoms/p";
import { Screen } from "./screen";

const meta: Meta<typeof Screen> = {
	title: "Templates/Screen",
	component: Screen,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	argTypes: {
		screenType: {
			control: { type: "select" },
			options: ["FIRST", "MIDDLE", "FOOTER"],
		},
		screenId: {
			control: { type: "text" },
		},
		children: {
			control: { type: "object" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstScreen: Story = {
	args: {
		screenType: ScreenType.FIRST,
		screenId: "hero",
		children: (
			<div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
				<TypographyH1 text="Welcome to the First Screen" />
				<TypographyP text="This is the hero section of the page." />
			</div>
		),
	},
};

export const MiddleScreen: Story = {
	args: {
		screenType: ScreenType.MIDDLE,
		screenId: "content",
		children: (
			<div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
				<TypographyH1 text="Middle Content Section" />
				<TypographyP text="This is the main content area of the page." />
			</div>
		),
	},
};

export const FooterScreen: Story = {
	args: {
		screenType: ScreenType.FOOTER,
		screenId: "footer",
		children: (
			<div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
				<TypographyH1 text="Footer Section" />
				<TypographyP text="This is the footer area of the page." />
			</div>
		),
	},
};
