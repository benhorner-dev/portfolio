import type { Meta, StoryObj } from "@storybook/react";
import { LogoButton } from "@/components/atoms/logoButton";
import { NavigationButton } from "@/components/atoms/navigationButton";
import { Navigation } from "./navigation";

const meta: Meta<typeof Navigation> = {
	title: "Organisms/Navigation",
	component: Navigation,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	argTypes: {
		logoButton: {
			control: { type: "object" },
		},
		navigationButtons: {
			control: { type: "object" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		logoButton: <LogoButton href="#home" />,
		navigationButtons: [
			<NavigationButton key="about" href="#about" text="About" />,
			<NavigationButton key="contact" href="#contact" text="Contact" />,
		],
	},
};

export const WithManyNavItems: Story = {
	args: {
		logoButton: <LogoButton href="#home" />,
		navigationButtons: [
			<NavigationButton key="about" href="#about" text="About" />,
			<NavigationButton key="services" href="#services" text="Services" />,
			<NavigationButton key="portfolio" href="#portfolio" text="Portfolio" />,
			<NavigationButton key="contact" href="#contact" text="Contact" />,
		],
	},
};

export const WithSingleNavItem: Story = {
	args: {
		logoButton: <LogoButton href="#home" />,
		navigationButtons: [
			<NavigationButton key="about" href="#about" text="About" />,
		],
	},
};
