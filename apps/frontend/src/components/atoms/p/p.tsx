import type { TypographyProps } from "@/lib/types";

export function TypographyP({ text }: TypographyProps) {
	return <p className="leading-7 [&:not(:first-child)]:mt-6">{text}</p>;
}
