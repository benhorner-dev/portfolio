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
