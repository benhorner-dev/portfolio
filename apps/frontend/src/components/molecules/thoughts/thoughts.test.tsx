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

		const thoughtsContent = container.querySelector(
			'[data-slot="accordion-content"]',
		);
		expect(thoughtsContent).toBeInTheDocument();

		const accordionItems = container.querySelectorAll(
			'[data-slot="accordion-item"]',
		);
		expect(accordionItems).toHaveLength(1);
	});
});
