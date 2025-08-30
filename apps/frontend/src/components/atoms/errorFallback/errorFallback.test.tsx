import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorFallback } from "./errorFallback";

const mockResetError = vi.fn();

describe("ErrorFallback", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders error message and reset button", () => {
		const error = new Error("Test error message");
		render(
			<ErrorFallback
				error={error}
				componentStack="TestComponent"
				eventId="error-123"
				resetError={mockResetError}
			/>,
		);

		expect(screen.getByText("Chat Unavailable")).toBeInTheDocument();
		expect(
			screen.getByText(
				"We're experiencing technical difficulties with the chat feature. Please try again later.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Try Again" }),
		).toBeInTheDocument();
	});

	it("calls resetError when Try Again button is clicked", () => {
		const error = new Error("Test error message");
		const { container } = render(
			<ErrorFallback
				error={error}
				componentStack="TestComponent"
				eventId="error-123"
				resetError={mockResetError}
			/>,
		);

		const resetButton = container.querySelector('button[data-slot="button"]');
		expect(resetButton).toBeInTheDocument();
		if (!resetButton) {
			throw new Error("Reset button not found");
		}
		fireEvent.click(resetButton);

		expect(mockResetError).toHaveBeenCalledTimes(1);
	});
});
