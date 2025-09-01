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
		<div className="terminal-frame crt-effect relative text-center max-w-2xl mx-auto px-8 py-10 bg-ctp-surface0/80 backdrop-blur-md rounded-lg border border-ctp-surface2 shadow-2xl animate-terminal-glow">
			<div className="absolute top-0 left-0 right-0 h-8 bg-ctp-surface2/50 rounded-t-lg flex items-center px-4 border-b border-ctp-overlay0/30">
				<div className="flex space-x-2">
					<div className="w-3 h-3 rounded-full bg-ctp-red"></div>
					<div className="w-3 h-3 rounded-full bg-ctp-yellow"></div>
					<div className="w-3 h-3 rounded-full bg-ctp-green"></div>
				</div>
				<div className="flex-1 text-center">
					<span className="text-xs text-ctp-subtext0 font-mono">
						terminal@unix:~$
					</span>
				</div>
			</div>

			<div className="pt-6 space-y-6">
				<div className="text-ctp-green">{header}</div>

				<div className="text-ctp-text">{body}</div>

				<div className="terminal-prompt">{cta}</div>
			</div>

			<div className="absolute bottom-4 left-6 terminal-cursor text-ctp-green opacity-75"></div>
		</div>
	);
}
