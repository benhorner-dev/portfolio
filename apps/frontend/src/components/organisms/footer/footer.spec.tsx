import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { TypographyH1 } from "@/components/atoms/h1";
import { TypographyP } from "@/components/atoms/p";
import { Socials } from "@/components/molecules/socials";
import { Footer } from "./footer";

describe("Footer", () => {
	it("renders", () => {
		render(
			<Footer
				title={<TypographyH1 text="Footer" />}
				description={<TypographyP text="Footer description" />}
				socials={<Socials links={[]} />}
			/>,
		);
	});
});
