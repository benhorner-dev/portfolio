import { cleanup, render, screen } from "@testing-library/react";
import type { StaticImageData } from "next/image";
import { beforeEach, expect, it } from "vitest";
import { ImageSrc } from "@/lib/constants";
import { SocialLink } from "./index";

const createMockImage = (src: string): StaticImageData => ({
	src,
	height: 64,
	width: 64,
	blurDataURL:
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
	blurWidth: 1,
	blurHeight: 1,
});

beforeEach(() => {
	cleanup();
});

it("SocialLink renders with correct props", () => {
	render(
		<SocialLink
			href="https://github.com"
			alt="GitHub"
			src={ImageSrc.GITHUB}
			imgGttr={() => createMockImage("/images/github.png")}
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
			src={ImageSrc.LINKEDIN}
			imgGttr={() => createMockImage("/images/linked-in.png")}
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
			src={ImageSrc.GITHUB}
			imgGttr={() => createMockImage("/images/example.png")}
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
			src={ImageSrc.GITHUB}
			imgGttr={() => createMockImage("/images/twitter.png")}
		/>,
	);

	const image = screen.getByAltText("Twitter");
	expect(image).toBeInTheDocument();
});
