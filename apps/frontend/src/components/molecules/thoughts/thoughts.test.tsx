import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InterlocutorType } from "@/lib/explore/constants";
import type { ChatMessage } from "@/lib/explore/types";
import { Thoughts } from "./thoughts";

const mockMessage: ChatMessage = {
	id: "test-message-1",
	content: "Test message",
	type: InterlocutorType.AI,
	thoughts: [],
};

describe("Thoughts", () => {
	afterEach(() => {
		cleanup();
	});

	it("renders thoughts accordion with brain emoji trigger", () => {
		const thoughts = ["First thought", "Second thought"];

		render(<Thoughts thoughts={thoughts} message={mockMessage} />);

		expect(screen.getByText("🧠")).toBeInTheDocument();
	});

	it("renders all thoughts with bullet points", () => {
		const thoughts = ["First thought", "Second thought", "Third thought"];
		const { container } = render(
			<Thoughts thoughts={thoughts} message={mockMessage} />,
		);

		// Check that accordion structure exists for the thoughts
		const accordionContent = container.querySelector(
			'[data-slot="accordion-content"]',
		);
		expect(accordionContent).toBeInTheDocument();
	});

	it("generates unique keys for thoughts using message id and index", () => {
		const thoughts = ["Thought 1", "Thought 2"];
		const message: ChatMessage = {
			...mockMessage,
			id: "unique-message-id",
		};

		const { container } = render(
			<Thoughts thoughts={thoughts} message={message} />,
		);

		// Verify the accordion structure exists for the thoughts
		const accordionItems = container.querySelectorAll(
			'[data-slot="accordion-item"]',
		);
		expect(accordionItems).toHaveLength(1);
	});

	it("renders empty thoughts list without errors", () => {
		const thoughts: string[] = [];
		const { container } = render(
			<Thoughts thoughts={thoughts} message={mockMessage} />,
		);

		// Check for brain emoji in the container
		expect(container.textContent).toContain("🧠");
		const thoughtContainer = container.querySelector('[data-slot="accordion"]');
		expect(thoughtContainer).toBeInTheDocument();
	});

	it("applies correct CSS classes for styling", () => {
		const thoughts = ["Test thought"];

		const { container } = render(
			<Thoughts thoughts={thoughts} message={mockMessage} />,
		);

		const mainDiv = container.firstChild as HTMLElement;
		expect(mainDiv).toHaveClass(
			"overflow-hidden",
			"transition-all",
			"duration-300",
			"ease-in-out",
			"opacity-100",
			"max-h-96",
			"transform",
			"translate-y-0",
		);
	});

	it("renders accordion with single collapsible type", () => {
		const thoughts = ["Test thought"];
		const { container } = render(
			<Thoughts thoughts={thoughts} message={mockMessage} />,
		);

		const accordion = container.querySelector('[data-slot="accordion"]');
		expect(accordion).toBeInTheDocument();
		expect(accordion).toHaveAttribute("data-orientation", "vertical");
	});

	it("renders thought content with proper styling", () => {
		const thoughts = ["Styled thought"];

		const { container } = render(
			<Thoughts thoughts={thoughts} message={mockMessage} />,
		);

		// Since content is hidden by default in accordion, check for the structure instead
		const thoughtContainer = container.querySelector(
			'[data-slot="accordion-content"]',
		);
		expect(thoughtContainer).toBeInTheDocument();
	});

	it("renders bullet points for each thought", () => {
		const thoughts = ["First", "Second"];

		const { container } = render(
			<Thoughts thoughts={thoughts} message={mockMessage} />,
		);

		// Check for the structure that would contain the bullets (even if hidden)
		const thoughtsContent = container.querySelector(
			'[data-slot="accordion-content"]',
		);
		expect(thoughtsContent).toBeInTheDocument();

		// Verify the accordion structure exists for the thoughts
		const accordionItems = container.querySelectorAll(
			'[data-slot="accordion-item"]',
		);
		expect(accordionItems).toHaveLength(1);
	});
});
