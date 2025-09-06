import type { Meta, StoryObj } from "@storybook/react";
import { MarkdownWrapper } from "./markdownWrapper";

const meta: Meta<typeof MarkdownWrapper> = {
	title: "Molecules/MarkdownWrapper",
	component: MarkdownWrapper,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A wrapper component for rendering markdown text with custom styling. Uses react-markdown under the hood with predefined component styles for headings, paragraphs, lists, and other markdown elements.",
			},
		},
	},
	argTypes: {
		text: {
			control: "text",
			description: "The markdown text to render",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		text: "This is a simple markdown text with **bold** and *italic* formatting.",
	},
	render: (args) => (
		<div className="w-96 bg-white p-4 rounded-lg border">
			<MarkdownWrapper {...args} />
		</div>
	),
};

export const WithHeading: Story = {
	args: {
		text: `## Getting Started

This is a paragraph that follows the heading. It demonstrates how headings and paragraphs are styled in the markdown wrapper.`,
	},
	render: (args) => (
		<div className="w-96 bg-white p-4 rounded-lg border">
			<MarkdownWrapper {...args} />
		</div>
	),
};

export const WithList: Story = {
	args: {
		text: `## Features

Here are the key features:

- Easy to use markdown rendering
- Custom styled components
- Responsive design
- Clean typography`,
	},
	render: (args) => (
		<div className="w-96 bg-white p-4 rounded-lg border">
			<MarkdownWrapper {...args} />
		</div>
	),
};

export const WithSeparator: Story = {
	args: {
		text: `## Before the separator

This content appears before the horizontal rule.

---

This content appears after the horizontal rule, demonstrating the styled separator.`,
	},
	render: (args) => (
		<div className="w-96 bg-white p-4 rounded-lg border">
			<MarkdownWrapper {...args} />
		</div>
	),
};

export const WithEmphasis: Story = {
	args: {
		text: `## Styling Examples

This paragraph contains *emphasized text* that is styled with a smaller, gray appearance to create visual hierarchy and subtle emphasis.

Regular text flows normally while emphasized portions stand out appropriately.`,
	},
	render: (args) => (
		<div className="w-96 bg-white p-4 rounded-lg border">
			<MarkdownWrapper {...args} />
		</div>
	),
};

export const ComplexMarkdown: Story = {
	args: {
		text: `## Complete Example

This is a comprehensive markdown example that showcases multiple elements working together.

### Key Points

- First important point
- Second key consideration
- Third essential element

*Note: This is emphasized text that provides additional context.*

---

## Additional Section

Here's another paragraph that demonstrates the spacing and typography. The component handles multiple paragraphs gracefully.

- Another list item
- With multiple entries
- To show list styling

*Final emphasized note at the end.*`,
	},
	render: (args) => (
		<div className="max-w-lg bg-white p-6 rounded-lg border shadow-sm">
			<MarkdownWrapper {...args} />
		</div>
	),
};

export const MinimalContent: Story = {
	args: {
		text: "Just a simple sentence.",
	},
	render: (args) => (
		<div className="w-96 bg-white p-4 rounded-lg border">
			<MarkdownWrapper {...args} />
		</div>
	),
};

export const EmptyContent: Story = {
	args: {
		text: "",
	},
	render: (args) => (
		<div className="w-96 bg-white p-4 rounded-lg border min-h-16 flex items-center justify-center text-gray-400">
			<MarkdownWrapper {...args} />
			{!args.text && <span>No content to display</span>}
		</div>
	),
};

export const InMessageContext: Story = {
	args: {
		text: `## Response

Here's a detailed explanation that demonstrates how the markdown wrapper appears within a typical message context.

- Clear formatting
- Proper spacing
- Readable typography

*This styling integrates well with chat interfaces.*`,
	},
	render: (args) => (
		<div className="max-w-md bg-slate-50 rounded-lg p-4">
			<div className="bg-white rounded-lg p-4 shadow-sm border">
				<div className="text-xs text-gray-500 mb-2">AI Assistant</div>
				<MarkdownWrapper {...args} />
			</div>
		</div>
	),
};
