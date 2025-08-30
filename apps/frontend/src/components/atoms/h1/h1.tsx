import type { TypographyProps } from "@/lib/types";

export function TypographyH1({ text }: TypographyProps) {
	return (
		<h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
			{text}
		</h1>
	);
}
