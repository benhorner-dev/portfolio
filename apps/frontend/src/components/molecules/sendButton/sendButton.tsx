import { Button } from "@/components/atoms/button";

interface SendButtonProps {
	onClick: () => void;
	disabled?: boolean;
	className?: string;
}

export function SendButton({
	onClick,
	disabled = false,
	className = "",
}: SendButtonProps) {
	return (
		<Button
			variant="default"
			size="default"
			className={`h-[44px] px-6 ${
				disabled
					? "bg-muted text-muted-foreground cursor-not-allowed"
					: "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 cursor-pointer"
			} ${className}`}
			onClick={onClick}
			disabled={disabled}
		>
			<svg
				className="w-5 h-5"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M22 2L11 13M22 2l-7 20-4-9-4 20-7z"
				/>
			</svg>
			Send
		</Button>
	);
}
