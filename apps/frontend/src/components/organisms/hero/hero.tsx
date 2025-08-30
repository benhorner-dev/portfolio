import type { Button } from "@/components/atoms/button";
import type { TypographyH1 } from "@/components/atoms/h1";
import type { TypographyP } from "@/components/atoms/p";

interface HeroProps {
	header: React.ReactElement<React.ComponentProps<typeof TypographyH1>>;
	body: React.ReactElement<React.ComponentProps<typeof TypographyP>>;
	cta: React.ReactElement<React.ComponentProps<typeof Button>>;
}

export function Hero({ header, body, cta }: HeroProps) {
	return (
		<div className="text-center max-w-2xl mx-auto px-6 py-8 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/20 shadow-2xl">
			{header}
			{body}
			{cta}
		</div>
	);
}
