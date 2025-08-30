import type { Meta, StoryObj } from "@storybook/react";
import { TypographyH2 } from "@/components/atoms/h2";
import { TypographyP } from "@/components/atoms/p";
import { ChatHeader } from "./chatHeader";

const meta: Meta<typeof ChatHeader> = {
	title: "Molecules/ChatHeader",
	component: ChatHeader,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		title: {
			control: { type: "object" },
		},
		subtitle: {
			control: { type: "object" },
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: <TypographyH2 text="Chat Support" />,
		subtitle: <TypographyP text="How can we help you today?" />,
	},
};

export const WithLongText: Story = {
	args: {
		title: <TypographyH2 text="Customer Service Chat" />,
		subtitle: (
			<TypographyP text="Our team is here to assist you with any questions or concerns you may have about our products and services." />
		),
	},
};

export const WithShortText: Story = {
	args: {
		title: <TypographyH2 text="Help" />,
		subtitle: <TypographyP text="Need assistance?" />,
	},
};
