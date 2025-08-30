import type { ReactElement } from "react";
import type { Button } from "@/components/atoms/button";
import type { Input } from "@/components/atoms/input";

interface ChatInputProps {
	button: ReactElement<React.ComponentProps<typeof Button>>;
	input: ReactElement<React.ComponentProps<typeof Input>>;
}

export function ChatInput({ button, input }: ChatInputProps) {
	return (
		<div className="bg-card/40 px-6 py-4 border-t border-border/20">
			<div className="flex gap-3">
				{input}
				{button}
			</div>
		</div>
	);
}
