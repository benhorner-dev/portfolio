import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LogoButton } from "@/components/atoms/logoButton";
import { NavigationButton } from "@/components/atoms/navigationButton";
import { Navigation } from "./navigation";

describe("Navigation", () => {
	it("renders logo button and navigation buttons", () => {
		const logoButton = <LogoButton href="#home" />;
		const navigationButtons = [
			<NavigationButton key="about" href="#about" text="About" />,
			<NavigationButton key="contact" href="#contact" text="Contact" />,
		];

		const { container } = render(
			<Navigation
				logoButton={logoButton}
				navigationButtons={navigationButtons}
			/>,
		);

		const navElement = container.querySelector("nav");
		expect(navElement).toBeInTheDocument();
	});
});
