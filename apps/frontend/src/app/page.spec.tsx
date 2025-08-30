import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import Home, { generateMetadata } from "./page";

Object.defineProperty(HTMLDivElement.prototype, "scrollTo", {
	value: vi.fn(),
	writable: true,
});

vi.mock("@/lib/getContentConfig", () => ({
	getContentConfig: vi.fn().mockResolvedValue({
		background: {
			src: "/mock-background.jpg",
			alt: "Mock background",
		},
		hero: {
			title: "Mock Hero Title",
			description: "Mock hero description",
			ctaButton: {
				text: "Mock CTA",
			},
		},
		chat: {
			header: {
				title: "Mock Chat Title",
				subtitle: "Mock chat subtitle",
			},
			input: {
				placeholder: {
					default: "Mock placeholder",
					typing: "Mock typing...",
				},
				sendButton: {
					text: "Send",
				},
			},
			messages: {
				initial: {
					id: "1",
					text: "Mock initial message",
					quickReplies: ["Reply 1", "Reply 2"],
				},
				placeholder: {
					text: "Mock placeholder message",
					quickReplies: ["Reply 1", "Reply 2"],
				},
			},
		},
		footer: {
			title: "Mock Footer Title",
			description: "Mock footer description",
		},
		socials: [
			{
				key: "github",
				href: "https://github.com/mock",
				alt: "Mock GitHub",
				src: "/mock-github.png",
			},
		],
		navigation: {
			screenTypes: {
				first: "first",
				middle: "middle",
				footer: "footer",
			},
		},
		seo: {
			title: "Ben Horner - Full Stack Tech Lead",
			description: "Mock hero description",
			keywords: ["mock", "developer", "portfolio"],
			authors: ["Ben Horner"],
			creator: "Ben Horner",
			publisher: "Ben Horner",
			robots: "index, follow",
			canonical: "https://mock-domain.com",
			metadataBase: "https://mock-domain.com",
			openGraph: {
				title: "Ben Horner - Full Stack Tech Lead",
				description: "Mock hero description",
				type: "website",
				url: "https://mock-domain.com",
				siteName: "Ben Horner Portfolio",
				images: [
					{
						url: "/images/og-image.png",
						width: 1200,
						height: 630,
						alt: "Ben Horner - Full Stack Tech Lead",
					},
				],
				locale: "en_US",
			},
			structuredData: {
				"@context": "https://schema.org",
				"@type": "Person",
				person: {
					name: "Ben Horner",
					jobTitle: "Full Stack Tech Lead",
					url: "https://mock-domain.com",
				},
			},
		},
	}),
}));

it("Home page loads successfully", async () => {
	const { container } = render(await Home());
	expect(container).toBeDefined();
});

it("Metadata is generated correctly", async () => {
	const metadata = await generateMetadata();
	expect(metadata.title).toBe("Ben Horner - Full Stack Tech Lead");
});
