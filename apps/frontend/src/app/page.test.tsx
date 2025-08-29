import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
	it("should render 'Hello World' when flag is true", async () => {
		render(await Home());

		expect(screen.getByText("Hello World")).toBeInTheDocument();
	});
});
