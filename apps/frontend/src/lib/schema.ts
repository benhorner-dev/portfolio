import { z } from "zod";

export const HeroSchema = z.object({
	title: z.string(),
	description: z.string(),
	ctaButton: z.object({
		text: z.string(),
	}),
});

export const ChatInputSchema = z.object({
	placeholder: z.object({
		default: z.string(),
		typing: z.string(),
	}),
	sendButton: z.object({
		text: z.string(),
	}),
});

export const ChatMessagesSchema = z.object({
	initial: z.object({
		id: z.string(),
		text: z.string(),
		quickReplies: z.array(z.string()),
	}),
	placeholder: z.object({
		text: z.string(),
		quickReplies: z.array(z.string()),
	}),
});

export const ChatHeaderSchema = z.object({
	title: z.string(),
	subtitle: z.string(),
});

export const ChatSchema = z.object({
	header: ChatHeaderSchema,
	input: ChatInputSchema,
	messages: ChatMessagesSchema,
});

export const FooterSchema = z.object({
	title: z.string(),
	description: z.string(),
});

export const SocialSchema = z.object({
	key: z.string(),
	alt: z.string(),
	href: z.url(),
	src: z.string(),
});

export const SocialsSchema = z.array(SocialSchema);

export const NavigationSchema = z.object({
	screenTypes: z.object({
		first: z.string(),
		middle: z.string(),
		footer: z.string(),
	}),
});

export const BackgroundSchema = z.object({
	src: z.string(),
	alt: z.string(),
});

export const OpenGraphImageSchema = z.object({
	url: z.string(),
	width: z.number(),
	height: z.number(),
	alt: z.string(),
});

export const OpenGraphSchema = z.object({
	title: z.string(),
	description: z.string(),
	type: z.enum([
		"website",
		"article",
		"book",
		"profile",
		"music.song",
		"music.album",
		"music.playlist",
		"music.radio_station",
		"video.movie",
		"video.episode",
		"video.tv_show",
		"video.other",
	]),
	url: z.string(),
	siteName: z.string(),
	images: z.array(OpenGraphImageSchema),
	locale: z.string(),
});

export const StructuredDataSchema = z.object({
	"@context": z.string(),
	"@type": z.string(),
	person: z.object({
		name: z.string(),
		jobTitle: z.string(),
		url: z.string(),
	}),
});

export const SEOSchema = z.object({
	title: z.string(),
	description: z.string(),
	keywords: z.array(z.string()),
	authors: z.array(z.string()),
	creator: z.string(),
	publisher: z.string(),
	robots: z.string(),
	canonical: z.string(),
	metadataBase: z.string(),
	openGraph: OpenGraphSchema,
	structuredData: StructuredDataSchema,
});

export const ContentConfigSchema = z.object({
	background: BackgroundSchema,
	hero: HeroSchema,
	chat: ChatSchema,
	footer: FooterSchema,
	socials: SocialsSchema,
	navigation: NavigationSchema,
	seo: SEOSchema,
});

export type Hero = z.infer<typeof HeroSchema>;
export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatMessages = z.infer<typeof ChatMessagesSchema>;
export type ChatHeader = z.infer<typeof ChatHeaderSchema>;
export type Chat = z.infer<typeof ChatSchema>;
export type Footer = z.infer<typeof FooterSchema>;
export type Social = z.infer<typeof SocialSchema>;
export type Socials = z.infer<typeof SocialsSchema>;
export type Navigation = z.infer<typeof NavigationSchema>;
export type Background = z.infer<typeof BackgroundSchema>;
export type OpenGraphImage = z.infer<typeof OpenGraphImageSchema>;
export type OpenGraph = z.infer<typeof OpenGraphSchema>;
export type StructuredData = z.infer<typeof StructuredDataSchema>;
export type SEO = z.infer<typeof SEOSchema>;
export type ContentConfig = z.infer<typeof ContentConfigSchema>;
