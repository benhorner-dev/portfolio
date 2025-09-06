import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownWrapper } from "./markdownWrapper";

describe("MarkdownWrapper", () => {
	it("renders basic text", () => {
		render(<MarkdownWrapper text="Hello world" />);
		expect(screen.getByText("Hello world")).toBeInTheDocument();
	});

	it("renders h2 headings with correct styling", () => {
		render(<MarkdownWrapper text="## Test Heading" />);

		const heading = screen.getByRole("heading", { level: 2 });
		expect(heading).toBeInTheDocument();
		expect(heading).toHaveClass(
			"text-lg",
			"font-semibold",
			"mt-3",
			"mb-2",
			"text-gray-900",
		);
	});

	it("renders paragraphs with correct styling", () => {
		render(<MarkdownWrapper text="This is a paragraph" />);

		const paragraph = screen.getByText("This is a paragraph");
		expect(paragraph.tagName).toBe("P");
		expect(paragraph).toHaveClass("leading-7", "[&:not(:first-child)]:mt-6");
	});

	it("renders unordered lists with correct styling", () => {
		const { container } = render(<MarkdownWrapper text="- Item 1\n- Item 2" />);

		const list = container.querySelector("ul");
		expect(list).toBeInTheDocument();
		expect(list).toHaveClass("list-disc", "pl-4", "mb-2");
	});

	it("renders list items with correct styling", () => {
		const { container } = render(<MarkdownWrapper text="- List item" />);

		const listItem = container.querySelector("li");
		expect(listItem).toBeInTheDocument();
		expect(listItem).toHaveClass("mb-1");
	});

	it("renders horizontal rules with correct styling", () => {
		const { container } = render(<MarkdownWrapper text="---" />);

		const hr = container.querySelector("hr");
		expect(hr).toBeInTheDocument();
		expect(hr).toHaveClass("my-3", "border-gray-300");
	});

	it("renders emphasized text with correct styling", () => {
		const { container } = render(<MarkdownWrapper text="*emphasized text*" />);

		const em = container.querySelector("em");
		expect(em).toBeInTheDocument();
		expect(em).toHaveClass("text-gray-600", "text-sm");
		expect(em).toHaveTextContent("emphasized text");
	});

	it("renders complex markdown with multiple elements", () => {
		const complexMarkdown = `
## Heading

This is a paragraph.

- First item
- Second item

*Emphasized text*

---

Another paragraph.
		`.trim();

		render(<MarkdownWrapper text={complexMarkdown} />);

		expect(screen.getByText("Heading")).toBeInTheDocument();
		expect(screen.getByText("This is a paragraph.")).toBeInTheDocument();
		expect(screen.getByText("First item")).toBeInTheDocument();
		expect(screen.getByText("Second item")).toBeInTheDocument();
		expect(screen.getByText("Emphasized text")).toBeInTheDocument();
		expect(screen.getByText("Another paragraph.")).toBeInTheDocument();
	});
});
