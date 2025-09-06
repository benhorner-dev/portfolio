import type { Meta, StoryObj } from "@storybook/react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "./accordion";

const meta = {
	title: "Atoms/Accordion",
	component: Accordion,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A collapsible component built on Radix UI that allows users to expand and collapse content sections. Perfect for organizing information in a space-efficient way.",
			},
		},
	},
	argTypes: {
		type: {
			control: "select",
			options: ["single", "multiple"],
			description: "Whether only one or multiple items can be open at once",
		},
		collapsible: {
			control: "boolean",
			description: "Whether items can be collapsed when in single mode",
		},
		defaultValue: {
			control: "text",
			description: "The default open item(s)",
		},
	},
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		type: "single" as const,
		collapsible: true,
	},
	render: (args) => (
		<div className="w-96">
			<Accordion {...args}>
				<AccordionItem value="item-1">
					<AccordionTrigger>What is React?</AccordionTrigger>
					<AccordionContent>
						React is a JavaScript library for building user interfaces,
						particularly web applications. It was developed by Facebook and is
						now maintained by Meta and the open-source community.
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-2">
					<AccordionTrigger>How does it work?</AccordionTrigger>
					<AccordionContent>
						React uses a component-based architecture where you build
						encapsulated components that manage their own state, then compose
						them to make complex UIs.
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-3">
					<AccordionTrigger>Why use React?</AccordionTrigger>
					<AccordionContent>
						React makes it painless to create interactive UIs, has a rich
						ecosystem, strong community support, and is backed by Meta with
						excellent documentation and tooling.
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	),
};

export const SingleWithDefault: Story = {
	args: {
		type: "single" as const,
		collapsible: true,
		defaultValue: "item-2",
	},
	render: (args) => (
		<div className="w-96">
			<Accordion {...args}>
				<AccordionItem value="item-1">
					<AccordionTrigger>Getting Started</AccordionTrigger>
					<AccordionContent>
						Install React using npm or yarn, then create your first component.
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-2">
					<AccordionTrigger>Components</AccordionTrigger>
					<AccordionContent>
						Components are the building blocks of React applications. They can
						be functional or class-based components.
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-3">
					<AccordionTrigger>State Management</AccordionTrigger>
					<AccordionContent>
						React provides useState and useReducer hooks for managing component
						state, plus context for sharing state between components.
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	),
};

export const Multiple: Story = {
	args: {
		type: "multiple" as const,
		defaultValue: ["item-1", "item-3"],
	},
	render: (args) => (
		<div className="w-96">
			<Accordion {...args}>
				<AccordionItem value="item-1">
					<AccordionTrigger>Features</AccordionTrigger>
					<AccordionContent>
						<ul className="list-disc pl-4 space-y-1">
							<li>Virtual DOM for performance</li>
							<li>Component-based architecture</li>
							<li>Unidirectional data flow</li>
							<li>Rich ecosystem</li>
						</ul>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-2">
					<AccordionTrigger>Ecosystem</AccordionTrigger>
					<AccordionContent>
						React has a vast ecosystem including React Router for routing, Redux
						for state management, Next.js for server-side rendering, and many
						other tools and libraries.
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-3">
					<AccordionTrigger>Best Practices</AccordionTrigger>
					<AccordionContent>
						<ul className="list-disc pl-4 space-y-1">
							<li>Use functional components with hooks</li>
							<li>Keep components small and focused</li>
							<li>Use TypeScript for better development experience</li>
							<li>Test your components</li>
						</ul>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	),
};

export const SingleItem: Story = {
	args: {
		type: "single" as const,
		collapsible: true,
	},
	render: () => (
		<div className="w-96">
			<Accordion type="single" collapsible>
				<AccordionItem value="item-1">
					<AccordionTrigger>Single Accordion Item</AccordionTrigger>
					<AccordionContent>
						This accordion contains only one item. Perfect for simple show/hide
						functionality like FAQs or detailed descriptions.
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	),
};

export const CustomStyling: Story = {
	args: {
		type: "single" as const,
		collapsible: true,
		className: "bg-slate-50 rounded-lg p-2",
	},
	render: () => (
		<div className="w-96">
			<Accordion
				type="single"
				collapsible
				className="bg-slate-50 rounded-lg p-2"
			>
				<AccordionItem value="item-1" className="border-slate-200">
					<AccordionTrigger className="text-blue-600 hover:text-blue-800">
						Custom Styled Accordion
					</AccordionTrigger>
					<AccordionContent className="text-slate-600 bg-white rounded p-2">
						This accordion demonstrates custom styling capabilities. You can
						customize colors, spacing, borders, and more.
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-2" className="border-slate-200">
					<AccordionTrigger className="text-green-600 hover:text-green-800">
						Another Custom Item
					</AccordionTrigger>
					<AccordionContent className="text-slate-600 bg-white rounded p-2">
						Each item can have its own styling while maintaining the overall
						accordion behavior and accessibility features.
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	),
};
