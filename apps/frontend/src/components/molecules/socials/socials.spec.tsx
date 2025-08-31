import { render } from "@testing-library/react";
import type { StaticImageData } from "next/image";
import { describe, it } from "vitest";
import { SocialLink } from "@/components/atoms/socialLink";
import { ImageSrc } from "@/lib/constants";
import { Socials } from "./socials";

const createMockImage = (src: string): StaticImageData => ({
	src,
	height: 64,
	width: 64,
	blurDataURL:
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
	blurWidth: 1,
	blurHeight: 1,
});

describe("Socials", () => {
	it("renders", () => {
		render(
			<Socials
				links={[
					<SocialLink
						key="github"
						href="https://github.com"
						alt="GitHub"
						src={ImageSrc.GITHUB}
						imgGttr={() => createMockImage("/images/github.png")}
					/>,
				]}
			/>,
		);
	});
});
