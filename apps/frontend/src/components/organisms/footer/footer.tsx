import type { TypographyH1 } from "@/components/atoms/h1";
import type { TypographyP } from "@/components/atoms/p";
import type { Socials } from "@/components/molecules/socials";

interface FooterProps {
	title: React.ReactElement<React.ComponentProps<typeof TypographyH1>>;
	description: React.ReactElement<React.ComponentProps<typeof TypographyP>>;
	socials: React.ReactElement<React.ComponentProps<typeof Socials>>;
}

export function Footer({ title, description, socials }: FooterProps) {
	return (
		<div className="text-center max-w-2xl mx-auto px-6 py-8 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/20 shadow-2xl">
			{title}
			{description}
			{socials}
		</div>
	);
}
