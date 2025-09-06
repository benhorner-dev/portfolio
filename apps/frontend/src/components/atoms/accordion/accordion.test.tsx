import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "./accordion";

describe("Accordion Components", () => {
	describe("Accordion", () => {
		it("renders accordion with correct data attribute", () => {
			const { container } = render(
				<Accordion type="single" collapsible>
					<AccordionItem value="item-1">
						<AccordionTrigger>Test</AccordionTrigger>
						<AccordionContent>Content</AccordionContent>
					</AccordionItem>
				</Accordion>,
			);

			const accordion = container.querySelector('[data-slot="accordion"]');
			expect(accordion).toBeInTheDocument();
		});

		it("passes through props to AccordionPrimitive.Root", () => {
			const { container } = render(
				<Accordion type="single" collapsible className="custom-class">
					<AccordionItem value="item-1">
						<AccordionTrigger>Test</AccordionTrigger>
						<AccordionContent>Content</AccordionContent>
					</AccordionItem>
				</Accordion>,
			);

			const accordion = container.querySelector('[data-slot="accordion"]');
			expect(accordion).toHaveClass("custom-class");
		});
	});

	describe("AccordionItem", () => {
		it("renders accordion item with correct data attribute and default classes", () => {
			const { container } = render(
				<Accordion type="single" collapsible>
					<AccordionItem value="item-1">
						<AccordionTrigger>Test</AccordionTrigger>
						<AccordionContent>Content</AccordionContent>
					</AccordionItem>
				</Accordion>,
			);

			const item = container.querySelector('[data-slot="accordion-item"]');
			expect(item).toBeInTheDocument();
			expect(item).toHaveClass("border-b", "last:border-b-0");
		});

		it("merges custom className with default classes", () => {
			const { container } = render(
				<Accordion type="single" collapsible>
					<AccordionItem value="item-1" className="custom-item-class">
						<AccordionTrigger>Test</AccordionTrigger>
						<AccordionContent>Content</AccordionContent>
					</AccordionItem>
				</Accordion>,
			);

			const item = container.querySelector('[data-slot="accordion-item"]');
			expect(item).toHaveClass(
				"border-b",
				"last:border-b-0",
				"custom-item-class",
			);
		});
	});

	describe("AccordionTrigger", () => {
		it("renders trigger with correct data attribute and content", () => {
			const { container } = render(
				<Accordion type="single" collapsible>
					<AccordionItem value="item-1">
						<AccordionTrigger>Trigger Content</AccordionTrigger>
						<AccordionContent>Content</AccordionContent>
					</AccordionItem>
				</Accordion>,
			);

			const trigger = container.querySelector(
				'[data-slot="accordion-trigger"]',
			);
			expect(trigger).toBeInTheDocument();
			expect(trigger).toHaveTextContent("Trigger Content");
		});

		it("includes chevron icon", () => {
			const { container } = render(
				<Accordion type="single" collapsible>
					<AccordionItem value="item-1">
						<AccordionTrigger>Test</AccordionTrigger>
						<AccordionContent>Content</AccordionContent>
					</AccordionItem>
				</Accordion>,
			);

			const trigger = container.querySelector(
				'[data-slot="accordion-trigger"]',
			);
			const chevronIcon = trigger?.querySelector("svg");
			expect(chevronIcon).toBeInTheDocument();
		});

		it("applies custom className", () => {
			const { container } = render(
				<Accordion type="single" collapsible>
					<AccordionItem value="item-1">
						<AccordionTrigger className="custom-trigger-class">
							Test
						</AccordionTrigger>
						<AccordionContent>Content</AccordionContent>
					</AccordionItem>
				</Accordion>,
			);

			const trigger = container.querySelector(
				'[data-slot="accordion-trigger"]',
			);
			expect(trigger).toHaveClass("custom-trigger-class");
		});
	});

	describe("AccordionContent", () => {
		it("renders content with correct data attribute", () => {
			const { container } = render(
				<Accordion type="single" collapsible>
					<AccordionItem value="item-1">
						<AccordionTrigger>Test</AccordionTrigger>
						<AccordionContent>Content Text</AccordionContent>
					</AccordionItem>
				</Accordion>,
			);

			const content = container.querySelector(
				'[data-slot="accordion-content"]',
			);
			expect(content).toBeInTheDocument();
		});

		it("applies default animation classes", () => {
			const { container } = render(
				<Accordion type="single" collapsible>
					<AccordionItem value="item-1">
						<AccordionTrigger>Test</AccordionTrigger>
						<AccordionContent>Content</AccordionContent>
					</AccordionItem>
				</Accordion>,
			);

			const content = container.querySelector(
				'[data-slot="accordion-content"]',
			);
			expect(content).toHaveClass(
				"data-[state=closed]:animate-accordion-up",
				"data-[state=open]:animate-accordion-down",
				"overflow-hidden",
				"text-sm",
			);
		});

		it("applies custom className to inner div", () => {
			const { container } = render(
				<Accordion type="single" collapsible defaultValue="item-1">
					<AccordionItem value="item-1">
						<AccordionTrigger>Test</AccordionTrigger>
						<AccordionContent className="custom-content-class">
							Content
						</AccordionContent>
					</AccordionItem>
				</Accordion>,
			);

			const content = container.querySelector(
				'[data-slot="accordion-content"]',
			);
			const innerDiv = content?.querySelector("div");
			expect(innerDiv).toHaveClass("pt-0", "pb-4", "custom-content-class");
		});
	});
});
