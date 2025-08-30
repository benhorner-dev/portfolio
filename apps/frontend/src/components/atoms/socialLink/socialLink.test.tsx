import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { SocialLink } from "./index";

beforeEach(() => {
	cleanup();
});

it("SocialLink renders with correct props", () => {
	render(
		<SocialLink
			href="https://github.com"
			alt="GitHub"
			src="/images/github.png"
		/>,
	);

	const link = screen.getByRole("link");
	const image = screen.getByAltText("GitHub");

	expect(link).toHaveAttribute("href", "https://github.com");
	expect(link).toHaveAttribute("target", "_blank");
	expect(link).toHaveAttribute("rel", "noopener noreferrer");
	expect(image).toHaveAttribute("alt", "GitHub");
	expect(image).toHaveAttribute("width", "64");
	expect(image).toHaveAttribute("height", "64");
});

it("SocialLink applies correct CSS classes", () => {
	render(
		<SocialLink
			href="https://linkedin.com"
			alt="LinkedIn"
			src="/images/linkedin.png"
		/>,
	);

	const link = screen.getByRole("link");
	const image = screen.getByAltText("LinkedIn");

	expect(link).toHaveClass(
		"transition-transform",
		"duration-300",
		"hover:scale-110",
	);
	expect(image).toHaveClass("w-16", "h-16", "object-contain");
});

it("SocialLink handles different href protocols", () => {
	render(
		<SocialLink
			href="https://example.com"
			alt="Example"
			src="/images/example.png"
		/>,
	);

	const link = screen.getByRole("link");
	expect(link).toHaveAttribute("href", "https://example.com");
});

it("SocialLink handles different image sources", () => {
	render(
		<SocialLink
			href="https://twitter.com"
			alt="Twitter"
			src="/images/twitter.png"
		/>,
	);

	const image = screen.getByAltText("Twitter");
	expect(image).toBeInTheDocument();
});
