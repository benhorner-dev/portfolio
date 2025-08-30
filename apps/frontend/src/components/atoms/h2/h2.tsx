import type { TypographyProps } from "@/lib/types";

export function TypographyH2({ text }: TypographyProps) {
	return (
		<h2 className="scroll-m-20 pb-0 text-3xl font-semibold tracking-tight first:mt-0">
			{text}
		</h2>
	);
}
