import { cleanup, render } from "@testing-library/react";
import { beforeEach, it } from "vitest";
import { TypingIndicator } from "./typingIndicator";

beforeEach(() => {
	cleanup();
});

it("TypingIndicator renders three animated dots", () => {
	render(<TypingIndicator />);
});
