import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Fallback } from "./fallback";

describe("Fallback", () => {
	it("renders loading text", () => {
		render(<Fallback />);
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});
});
