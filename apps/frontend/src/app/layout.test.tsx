import { render } from "@testing-library/react";
import { test, vi } from "vitest";

vi.mock("next/font/google", () => ({
	Geist: vi.fn(() => ({
		variable: "--font-geist-sans",
	})),
	Geist_Mono: vi.fn(() => ({
		variable: "--font-geist-mono",
	})),
}));

vi.mock("./globals.css", () => ({}));

test("layout renders and executes all code paths", async () => {
	const LayoutModule = await import("./layout");
	const Layout = LayoutModule.default;

	LayoutModule.metadata;

	render(
		<Layout>
			<div>Test content</div>
		</Layout>,
	);
});
