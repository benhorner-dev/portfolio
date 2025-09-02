import { render } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import Home, { generateMetadata } from "./page";

Object.defineProperty(HTMLDivElement.prototype, "scrollTo", {
	value: vi.fn(),
	writable: true,
});

vi.mock("@/components/organisms/chatWrapper", () => ({
	ChatWrapper: () => (
		<div data-testid="chat-wrapper">
			<div data-testid="chat-placeholder">Chat placeholder</div>
		</div>
	),
}));

vi.mock("@/components/atoms/socialLink", () => ({
	SocialLink: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => (
		<a href={href} data-testid="social-link">
			{children}
		</a>
	),
}));

vi.mock("@/flags", () => ({
	chatEvalFlag: vi.fn(),
	createFeatureFlag: vi.fn(() => vi.fn().mockResolvedValue(true)),
}));

vi.mock("@/lib/getContentConfig", () => ({
	getContentConfig: vi.fn().mockResolvedValue({
		background: {
			src: "/images/hero.png",
			alt: "Background",
		},
		hero: {
			title: "Welcome to Ben Horner's portfolio",
			description:
				"I am a full stack tech lead, specialising in NLP, with a mission to create production ready, elegant applications that are reliable, maintainable, performant and scalable. My stack of choice is Typescript, React, Python and Postgres but I am always learning new technologies. Please feel free to explore my previous work and contact me if you have any questions:",
			ctaButton: {
				text: "Explore Ben's work",
			},
		},
		chat: {
			header: {
				title: "Explore Ben's work",
				subtitle: "Ask me anything about my portfolio...",
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
					text: "Hi! I'm Ben. Feel free to ask me anything about my projects, skills, or experience. What would you like to know?",
					quickReplies: [
						"Tell me about your projects",
						"What technologies do you use?",
						"What's your experience level?",
					],
				},
				placeholder: {
					text: "Thanks for your message! I'm currently working on implementing the full chat functionality. This is a placeholder response - soon you'll be able to have real conversations with me about my work!",
					quickReplies: [
						"Tell me about your projects",
						"What technologies do you use?",
						"What's your experience level?",
					],
				},
			},
			loginOverlay: {
				title: "Login Required",
				description:
					"Please log in to access the interactive chat feature and start a conversation with the AI assistant.",
				loginButton: {
					text: "Login to Chat",
				},
			},
		},
		footer: {
			title: "Let's Connect",
			description:
				"Ready to work together? Get in touch and let's build something amazing.",
		},
		socials: [
			{
				key: "github",
				alt: "GitHub",
				href: "https://github.com/ben-horner-dev",
				src: "/images/github.png",
			},
			{
				key: "linkedin",
				alt: "LinkedIn",
				href: "https://www.linkedin.com/in/ben-horner-dev/",
				src: "/images/linked-in.png",
			},
		],
		navigation: {
			screenTypes: {
				first: "hero",
				middle: "explore",
				footer: "contact",
			},
		},
		seo: {
			title: "Ben Horner - Full Stack Tech Lead",
			description:
				"I am a full stack tech lead, specialising in NLP, with a mission to create production ready, elegant applications that are reliable, maintainable, performant and scalable. My stack of choice is Typescript, React, Python and Postgres but I am always learning new technologies. Please feel free to explore my previous work and contact me if you have any questions:",
			keywords: [
				"full stack developer",
				"tech lead",
				"software engineer",
				"portfolio",
			],
			authors: ["Ben Horner"],
			creator: "Ben Horner",
			publisher: "Ben Horner",
			robots: "index, follow",
			canonical: "https://benhorner.dev",
			metadataBase: "https://benhorner.dev",
			openGraph: {
				title: "Ben Horner - Full Stack Tech Lead",
				description:
					"I am a full stack tech lead, specialising in NLP, with a mission to create production ready, elegant applications that are reliable, maintainable, performant and scalable. My stack of choice is Typescript, React, Python and Postgres but I am always learning new technologies. Please feel free to explore my previous work and contact me if you have any questions:",
				type: "website",
				url: "https://benhorner.dev",
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
					url: "https://benhorner.dev",
				},
			},
		},
	}),
}));

vi.mock("@/public/images/hero.png", () => ({
	default: {
		src: "/_next/static/media/hero.hash.png",
		height: 1080,
		width: 1920,
		blurDataURL:
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
		blurWidth: 1,
		blurHeight: 1,
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

it("Home page renders basic structure", async () => {
	const { container } = render(await Home());

	expect(container).toBeDefined();
	expect(container.innerHTML).toContain("Welcome to Ben Horner's portfolio");
	expect(container.innerHTML).toContain("Let's Connect");
	expect(container.innerHTML).toContain("Explore Ben's work");
});

it("Home page loads successfully with all features enabled", async () => {
	const { container, getAllByText } = render(await Home());

	expect(container).toBeDefined();
	expect(
		getAllByText("Welcome to Ben Horner's portfolio")[0],
	).toBeInTheDocument();
	expect(getAllByText("Let's Connect")[0]).toBeInTheDocument();
	expect(getAllByText("Explore Ben's work")[0]).toBeInTheDocument();
});

it("Metadata is generated correctly", async () => {
	const metadata = await generateMetadata();
	expect(metadata.title).toBe("Ben Horner - Full Stack Tech Lead");
});
