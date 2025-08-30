import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { SocialLink } from "@/components/atoms/socialLink";
import { Socials } from "./socials";

describe("Socials", () => {
	it("renders", () => {
		render(
			<Socials
				links={[
					<SocialLink
						key="github"
						href="https://github.com"
						alt="GitHub"
						src="/images/github.png"
					/>,
				]}
			/>,
		);
	});
});
