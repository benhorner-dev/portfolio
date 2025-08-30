import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { TypographyH2 } from "@/components/atoms/h2";
import { TypographyP } from "@/components/atoms/p";
import { ChatHeader } from "./chatHeader";

describe("ChatHeader", () => {
	it("renders", () => {
		render(
			<ChatHeader
				title={<TypographyH2 text="Chat Support" />}
				subtitle={<TypographyP text="How can we help you today?" />}
			/>,
		);
	});
});
