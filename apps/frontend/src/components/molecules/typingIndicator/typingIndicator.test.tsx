import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { TypingIndicator } from "./typingIndicator";

beforeEach(() => {
	cleanup();
});

it("TypingIndicator renders three animated dots", () => {
	render(<TypingIndicator />);

	const dots = screen
		.getAllByRole("generic")
		.filter((el) =>
			el.className.includes(
				"w-2 h-2 bg-muted-foreground rounded-full animate-bounce",
			),
		);
	expect(dots).toHaveLength(3);
});

it("TypingIndicator has proper styling classes", () => {
	render(<TypingIndicator />);

	const dots = screen
		.getAllByRole("generic")
		.filter((el) =>
			el.className.includes(
				"w-2 h-2 bg-muted-foreground rounded-full animate-bounce",
			),
		);
	const firstDot = dots[0];
	const container = firstDot.parentElement?.parentElement;
	expect(container).toHaveClass(
		"bg-primary/20",
		"backdrop-blur-sm",
		"rounded-2xl",
	);
});
