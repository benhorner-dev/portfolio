import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InterlocutorType } from "@/lib/explore/constants";
import type { ChatMessage } from "@/lib/explore/types";
import { TypingIndicator } from "./typingIndicator";

describe("TypingIndicator", () => {
	it("renders typing indicator when message has no content", () => {
		const message: ChatMessage = {
			id: "test-id",
			content: null,
			type: InterlocutorType.AI,
			thoughts: [],
		};

		const { container } = render(<TypingIndicator message={message} />);

		const typingContainer = container.querySelector(".flex.justify-start");
		expect(typingContainer).toBeInTheDocument();

		const dots = container.querySelectorAll(
			".w-2.h-2.bg-primary.rounded-full.animate-bounce",
		);
		expect(dots).toHaveLength(3);
	});

	it("does not render typing indicator when message has content", () => {
		const message: ChatMessage = {
			id: "test-id",
			content: "Hello world",
			type: InterlocutorType.AI,
			thoughts: [],
		};

		const { container } = render(<TypingIndicator message={message} />);

		const typingContainer = container.querySelector(".flex.justify-start");
		expect(typingContainer).not.toBeInTheDocument();
	});

	it("renders typing indicator when message content is empty string", () => {
		const message: ChatMessage = {
			id: "test-id",
			content: "",
			type: InterlocutorType.AI,
			thoughts: [],
		};

		const { container } = render(<TypingIndicator message={message} />);

		const typingContainer = container.querySelector(".flex.justify-start");
		expect(typingContainer).toBeInTheDocument();
	});

	it("applies correct styling classes to typing indicator", () => {
		const message: ChatMessage = {
			id: "test-id",
			content: null,
			type: InterlocutorType.AI,
			thoughts: [],
		};

		const { container } = render(<TypingIndicator message={message} />);

		const bubble = container.querySelector(".bg-primary\\/20");
		expect(bubble).toBeInTheDocument();
		expect(bubble).toHaveClass(
			"backdrop-blur-sm",
			"rounded-2xl",
			"px-4",
			"py-3",
			"max-w-xs",
			"border-primary/30",
			"animate-terminal-glow",
		);
	});

	it("applies correct animation delays to dots", () => {
		const message: ChatMessage = {
			id: "test-id",
			content: null,
			type: InterlocutorType.AI,
			thoughts: [],
		};

		const { container } = render(<TypingIndicator message={message} />);

		const dots = container.querySelectorAll(
			".w-2.h-2.bg-primary.rounded-full.animate-bounce",
		);
		expect(dots[0]).not.toHaveClass("[animation-delay:0.1s]");
		expect(dots[1]).toHaveClass("[animation-delay:0.1s]");
		expect(dots[2]).toHaveClass("[animation-delay:0.2s]");
	});
});
