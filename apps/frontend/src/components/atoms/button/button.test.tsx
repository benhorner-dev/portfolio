import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Button } from "./button";

it("Button renders as button element by default", () => {
	render(<Button>Click me</Button>);
	const button = screen.getByRole("button");
	expect(button).toHaveTextContent("Click me");
});

it("Button renders as child component when asChild is true", () => {
	render(
		<Button asChild>
			<a href="/test">Link Button</a>
		</Button>,
	);
	const link = screen.getByRole("link");
	expect(link).toHaveTextContent("Link Button");
});
