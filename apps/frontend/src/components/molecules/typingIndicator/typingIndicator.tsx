export function TypingIndicator() {
	return (
		<div className="flex justify-start">
			<div className="bg-primary/20 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-xs">
				<div className="flex space-x-1">
					<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
					<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]"></div>
					<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></div>
				</div>
			</div>
		</div>
	);
}
