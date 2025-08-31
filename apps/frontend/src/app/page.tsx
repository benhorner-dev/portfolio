import type { Metadata } from "next";
import { ScreenType } from "@/app/constants";
import { BackgroundImage } from "@/components/atoms/backgroundImage";
import { TypographyH1 } from "@/components/atoms/h1";
import { TypographyH2 } from "@/components/atoms/h2";
import { TypographyP } from "@/components/atoms/p";
import { SocialLink } from "@/components/atoms/socialLink";
import { ChatHeader } from "@/components/molecules/chatHeader";
import { HeroCTA } from "@/components/molecules/heroCTA";
import { Socials } from "@/components/molecules/socials";
import { ChatWrapper } from "@/components/organisms/chatWrapper";
import { Footer } from "@/components/organisms/footer";
import { Hero } from "@/components/organisms/hero";
import { Screen } from "@/components/templates/screen";
import { getContentConfig } from "@/lib/getContentConfig";
import { getImageSrc } from "@/lib/utils";

export const dynamic = "force-static";
export const revalidate = false;
export const fetchCache = "force-cache";

export async function generateMetadata(): Promise<Metadata> {
	const contentConfig = await getContentConfig();

	return {
		metadataBase: new URL(contentConfig.seo.metadataBase),
		title: contentConfig.seo.title,
		description: contentConfig.seo.description,
		keywords: contentConfig.seo.keywords,
		authors: contentConfig.seo.authors.map((name) => ({ name })),
		creator: contentConfig.seo.creator,
		publisher: contentConfig.seo.publisher,
		robots: contentConfig.seo.robots,
		openGraph: contentConfig.seo.openGraph,
		alternates: {
			canonical: contentConfig.seo.canonical,
		},
	};
}

export default async function Home() {
	const contentConfig = await getContentConfig();
	const structuredData = {
		"@context": contentConfig.seo.structuredData["@context"],
		"@type": contentConfig.seo.structuredData["@type"],
		name: contentConfig.seo.structuredData.person.name,
		jobTitle: contentConfig.seo.structuredData.person.jobTitle,
		description: contentConfig.seo.description,
		url: contentConfig.seo.structuredData.person.url,
		sameAs: contentConfig.socials.map((social) => social.href),
	};
	const chatHeader = (
		<ChatHeader
			title={<TypographyH2 text={contentConfig.chat.header.title} />}
			subtitle={<TypographyP text={contentConfig.chat.header.subtitle} />}
		/>
	);

	const socials = (
		<Socials
			links={contentConfig.socials.map((social) => (
				<SocialLink
					key={social.key}
					href={social.href}
					alt={social.alt}
					src={social.src}
				/>
			))}
		/>
	);

	return (
		<>
			<script
				type="application/ld+json"
				/* biome-ignore lint/security/noDangerouslySetInnerHtml: Structured data for SEO */
				dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
			/>
			<BackgroundImage
				src={getImageSrc(contentConfig.background.src)}
				alt={contentConfig.background.alt}
			/>

			<div className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory px-4 sm:px-6 lg:px-8 scroll-smooth">
				<Screen
					screenType={ScreenType.FIRST}
					screenId={contentConfig.navigation.screenTypes.first}
				>
					<Hero
						header={<TypographyH1 text={contentConfig.hero.title} />}
						body={<TypographyP text={contentConfig.hero.description} />}
						cta={
							<HeroCTA
								text={contentConfig.hero.ctaButton.text}
								middleScreenId={contentConfig.navigation.screenTypes.middle}
							/>
						}
					/>
				</Screen>

				<Screen
					screenType={ScreenType.MIDDLE}
					screenId={contentConfig.navigation.screenTypes.middle}
				>
					<ChatWrapper
						header={chatHeader}
						placeholderTexts={contentConfig.chat.input.placeholder}
					/>
				</Screen>

				<Screen
					screenType={ScreenType.FOOTER}
					screenId={contentConfig.navigation.screenTypes.footer}
				>
					<Footer
						title={<TypographyH1 text={contentConfig.footer.title} />}
						description={
							<TypographyP text={contentConfig.footer.description} />
						}
						socials={socials}
					/>
				</Screen>
			</div>
		</>
	);
}
