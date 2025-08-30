import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { SendButton } from "./sendButton";

beforeEach(() => {
	cleanup();
});

it("SendButton renders enabled by default", () => {
	const onClick = vi.fn();
	render(<SendButton onClick={onClick} />);

	const button = screen.getByRole("button", { name: "Send" });
	expect(button).toBeInTheDocument();
	expect(button).not.toBeDisabled();
});

it("SendButton renders disabled state", () => {
	const onClick = vi.fn();
	render(<SendButton onClick={onClick} disabled={true} />);

	const button = screen.getByRole("button", { name: "Send" });
	expect(button).toBeDisabled();
});

it("SendButton calls onClick when clicked and enabled", () => {
	const onClick = vi.fn();
	render(<SendButton onClick={onClick} />);

	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	expect(onClick).toHaveBeenCalledTimes(1);
});

it("SendButton does not call onClick when disabled", () => {
	const onClick = vi.fn();
	render(<SendButton onClick={onClick} disabled={true} />);

	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	expect(onClick).not.toHaveBeenCalled();
});
