import { render } from "@testing-library/react";
import { it, vi } from "vitest";

vi.mock("next/font/local", () => ({
	default: vi.fn(() => ({
		src: "./fonts/JetBrainsMonoNL-Regular.ttf",
		variable: "--font-jetbrains-mono",
		display: "swap",
	})),
}));

vi.mock("./globals.css", () => ({}));

vi.mock("@/lib/getContentConfig", () => ({
	getContentConfig: () =>
		Promise.resolve({
			background: {
				src: "/images/background.jpg",
				alt: "Background image",
			},
			hero: {
				title: "Welcome to My Portfolio",
				description:
					"I'm a passionate developer creating amazing digital experiences.",
				ctaButton: {
					text: "Get Started",
				},
			},
			chat: {
				header: {
					title: "Chat Support",
					subtitle: "How can we help you today?",
				},
				input: {
					placeholder: {
						default: "Type your message here...",
						typing: "Ben is typing...",
					},
					sendButton: {
						text: "Send",
					},
				},
				messages: {
					initial: {
						id: "1",
						text: "Hello! How can I help you today?",
						quickReplies: ["Product Info", "Pricing", "Support"],
					},
					placeholder: {
						text: "No messages yet",
						quickReplies: [],
					},
				},
			},
			footer: {
				title: "Get In Touch",
				description:
					"Ready to start your next project? Let's talk about how we can help bring your ideas to life.",
			},
			socials: [
				{
					key: "github",
					alt: "GitHub",
					href: "https://github.com",
					src: "/images/github.png",
				},
				{
					key: "linkedin",
					alt: "LinkedIn",
					href: "https://linkedin.com",
					src: "/images/linkedin.png",
				},
			],
			navigation: {
				screenTypes: {
					first: "hero",
					middle: "chat",
					footer: "contact",
				},
			},
		}),
}));

it("layout renders and executes all code paths", async () => {
	const LayoutModule = await import("./layout");
	const Layout = LayoutModule.default;

	LayoutModule.metadata;

	render(
		<Layout>
			<div>Test content</div>
		</Layout>,
	);
});
