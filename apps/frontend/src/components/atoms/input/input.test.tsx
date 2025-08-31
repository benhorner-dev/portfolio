import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Input } from "./index";

it("Input renders with default variant and size", () => {
	render(<Input placeholder="Enter text" />);

	const input = screen.getByPlaceholderText("Enter text");
	expect(input).toBeInTheDocument();
	expect(input).toHaveClass("border-input");
});

it("Input renders with error variant", () => {
	render(<Input variant="error" placeholder="Error input" />);

	const input = screen.getByPlaceholderText("Error input");
	expect(input).toHaveClass("border-destructive");
});

it("Input renders with success variant", () => {
	render(<Input variant="success" placeholder="Success input" />);

	const input = screen.getByPlaceholderText("Success input");
	expect(input).toHaveClass("border-green-500");
});

it("Input handles ref", () => {
	const ref = { current: null };
	render(<Input ref={ref} placeholder="Ref input" />);

	const input = screen.getByPlaceholderText("Ref input");
	expect(input).toBeInTheDocument();
});

it("Input spreads additional props", () => {
	render(<Input data-testid="test-input" placeholder="Test input" />);

	const input = screen.getByTestId("test-input");
	expect(input).toBeInTheDocument();
});
