interface ChatWindowWrappersProps {
	children: React.ReactNode;
	topLevelClassName?: string;
}

export function ChatWindowWrapper({
	children,
	topLevelClassName,
}: ChatWindowWrappersProps) {
	return (
		<div className={`w-full max-w-2xl mx-auto px-6 py-8 ${topLevelClassName}`}>
			{children}
		</div>
	);
}
