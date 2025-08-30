import type { TypographyH2 } from "@/components/atoms/h2";
import type { TypographyP } from "@/components/atoms/p";

interface ChatHeaderProps {
	title: React.ReactElement<React.ComponentProps<typeof TypographyH2>>;
	subtitle: React.ReactElement<React.ComponentProps<typeof TypographyP>>;
}

export function ChatHeader({ title, subtitle }: ChatHeaderProps) {
	return (
		<div className="bg-card/40 px-6 py-4">
			{title}
			{subtitle}
		</div>
	);
}
