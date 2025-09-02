import type { Meta, StoryObj } from "@storybook/react";
import NotFound from "./not-found";

const meta: Meta<typeof NotFound> = {
	title: "Pages/NotFound",
	component: NotFound,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A Next.js 404 not found page component that displays when a requested resource cannot be found. Features terminal-style styling, animations, and helpful guidance for users who encounter broken links or mistyped URLs.",
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
					"The default 404 not found page that displays when a user navigates to a non-existent route. Features terminal-style design with animations and helpful troubleshooting guidance.",
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
					"Same 404 page but demonstrates the terminal-style animations and styling effects including error shake, terminal flicker, and glow effects.",
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
					"404 page displayed in a dark theme context, showing how the terminal styling adapts to different background colors.",
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
					"404 page displayed in a light theme context, demonstrating the contrast and readability of the terminal styling.",
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
					"404 page displayed on mobile devices, showing the responsive design and how the terminal frame adapts to smaller screens.",
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
					"404 page displayed on tablet devices, demonstrating the responsive layout and spacing adjustments.",
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
					"404 page displayed on desktop devices, showing the full terminal-style design with optimal spacing and layout.",
			},
		},
	},
};

export const WithLongURL: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"404 page that might be displayed when users encounter very long or complex URLs that don't exist on the site.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="bg-ctp-base min-h-screen">
				<div className="absolute top-4 left-4 right-4 text-center">
					<div className="bg-ctp-surface0 p-2 rounded text-ctp-subtext0 text-sm font-mono break-all">
						Simulated URL:
						/very/long/path/that/does/not/exist/and/might/cause/this/page/to/display
					</div>
				</div>
				<Story />
			</div>
		),
	],
};

export const WithSearchContext: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"404 page displayed in a context where users might have been searching for something specific, showing how the page provides helpful guidance.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="bg-ctp-base min-h-screen">
				<div className="absolute top-4 left-4 right-4 text-center">
					<div className="bg-ctp-surface0 p-2 rounded text-ctp-subtext0 text-sm font-mono">
						Search context: User was looking for "portfolio projects" but landed
						on a 404
					</div>
				</div>
				<Story />
			</div>
		),
	],
};
