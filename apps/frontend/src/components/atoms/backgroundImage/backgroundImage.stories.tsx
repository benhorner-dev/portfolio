import type { Meta, StoryObj } from "@storybook/react";
import Image from "next/image";
import backgroundImage from "@/public/images/hero.png";
import { BackgroundImage } from "./backgroundImage";

const meta: Meta<typeof BackgroundImage> = {
	title: "Atoms/BackgroundImage",
	component: BackgroundImage,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"A background image component that displays an image with a dark overlay, positioned absolutely to fill its container. Useful for hero sections and background imagery.",
			},
		},
	},
	argTypes: {
		src: {
			control: "text",
			description: "The source URL of the background image",
		},
		alt: {
			control: "text",
			description: "Alternative text for accessibility",
		},
		priority: {
			control: "boolean",
			description: "Whether to prioritize loading of the image",
		},
	},
	decorators: [
		(Story) => (
			<div className="relative w-full h-96 bg-muted">
				<Story />
				<div className="relative z-10 flex items-center justify-center h-full text-foreground">
					<div className="text-center">
						<h1 className="text-4xl font-bold mb-4">Content Overlay</h1>
						<p className="text-lg">
							This content appears over the background image
						</p>
					</div>
				</div>
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		src: backgroundImage,
		alt: "Hero background image",
		priority: true,
	},
};

export const WithLowPriority: Story = {
	args: {
		src: backgroundImage,
		alt: "Hero background image with low priority",
		priority: false,
	},
};

export const CustomAltText: Story = {
	args: {
		src: backgroundImage,
		alt: "A beautiful landscape with mountains and sky",
		priority: true,
	},
};

export const WithoutOverlay: Story = {
	render: (args) => (
		<div className="absolute inset-0 -z-10">
			<Image
				src={args.src}
				alt={args.alt}
				fill
				className="object-cover"
				sizes="100vw"
				quality={100}
			/>
		</div>
	),
	args: {
		src: backgroundImage,
		alt: "Hero background image without overlay",
		priority: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"This variant shows the background image without the dark overlay for comparison.",
			},
		},
	},
};

export const InContainer: Story = {
	decorators: [
		(Story) => (
			<div className="max-w-4xl mx-auto p-8">
				<div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
					<Story />
					<div className="relative z-10 flex items-center justify-center h-full text-foreground">
						<div className="text-center">
							<h2 className="text-2xl font-bold mb-2">Container Example</h2>
							<p>Background image within a contained layout</p>
						</div>
					</div>
				</div>
			</div>
		),
	],
	args: {
		src: backgroundImage,
		alt: "Container background image",
		priority: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"This variant demonstrates the BackgroundImage component within a contained layout with rounded corners.",
			},
		},
	},
};
