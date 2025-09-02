import type { Meta, StoryObj } from "@storybook/react";
import ErrorPage from "./error";

const meta: Meta<typeof ErrorPage> = {
	title: "Pages/Error",
	component: ErrorPage,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A Next.js error page component that displays a 500 Internal Server Error with terminal-style styling, animations, and troubleshooting guidance. This is the default error boundary page for the application.",
			},
		},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"The default error page that displays when an unhandled error occurs in the application. Features terminal-style design with animations and helpful troubleshooting steps.",
			},
		},
	},
};

export const WithCustomStyling: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"Same error page but demonstrates the terminal-style animations and styling effects including error shake, terminal flicker, and glow effects.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="bg-ctp-base min-h-screen">
				<Story />
			</div>
		),
	],
};

export const InDarkMode: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"Error page displayed in a dark theme context, showing how the terminal styling adapts to different background colors.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="bg-gray-900 min-h-screen">
				<Story />
			</div>
		),
	],
};

export const InLightMode: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"Error page displayed in a light theme context, demonstrating the contrast and readability of the terminal styling.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="bg-gray-100 min-h-screen">
				<Story />
			</div>
		),
	],
};

export const MobileView: Story = {
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				story:
					"Error page displayed on mobile devices, showing the responsive design and how the terminal frame adapts to smaller screens.",
			},
		},
	},
};

export const TabletView: Story = {
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
		docs: {
			description: {
				story:
					"Error page displayed on tablet devices, demonstrating the responsive layout and spacing adjustments.",
			},
		},
	},
};

export const DesktopView: Story = {
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "desktop",
		},
		docs: {
			description: {
				story:
					"Error page displayed on desktop devices, showing the full terminal-style design with optimal spacing and layout.",
			},
		},
	},
};
