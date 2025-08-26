import { render } from "@testing-library/react";
import { test } from "vitest";
import Home from "./page";

test("Home", () => {
	render(<Home />);
});
