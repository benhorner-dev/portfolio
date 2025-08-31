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
