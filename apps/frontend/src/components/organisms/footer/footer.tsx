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
		<div className="terminal-frame crt-effect text-center max-w-2xl mx-auto px-6 py-8 bg-ctp-surface0/60 backdrop-blur-sm rounded-lg border border-ctp-surface2 shadow-xl relative">
			<div className="absolute top-3 left-3 flex space-x-2">
				<div className="w-3 h-3 rounded-full bg-ctp-red"></div>
				<div className="w-3 h-3 rounded-full bg-ctp-green"></div>
				<div className="w-3 h-3 rounded-full bg-ctp-yellow"></div>
			</div>
			<div className="space-y-4">
				<div className="text-ctp-green">{title}</div>
				<div className="text-ctp-text">{description}</div>
				<div className="bg-ctp-surface1/40 rounded-lg p-4 border border-ctp-surface2/50">
					{socials}
				</div>
			</div>
		</div>
	);
}
