import { Button } from "@/components/atoms/button";

interface HeroCTAProps {
	text: string;
	middleScreenId: string;
}

export function HeroCTA({ text, middleScreenId }: HeroCTAProps) {
	return (
		<div className="mt-8">
			<a href={`#${middleScreenId}`}>
				<Button
					variant="default"
					size="lg"
					className="bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 cursor-pointer transition-all duration-300 ring-2 ring-accent/30 hover:ring-accent/60 animate-outline-glow hover:animate-none"
				>
					{text}
				</Button>
			</a>
		</div>
	);
}
