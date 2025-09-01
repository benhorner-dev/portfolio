export function TypingIndicator() {
	return (
		<div className="flex justify-start">
			<div className="terminal-frame bg-primary/20 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-xs border-primary/30 animate-terminal-glow">
				<div className="flex space-x-1">
					<div className="w-2 h-2 bg-primary rounded-full animate-bounce shadow-[0_0_5px_var(--ctp-primary)]"></div>
					<div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s] shadow-[0_0_5px_var(--ctp-primary)]"></div>
					<div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s] shadow-[0_0_5px_var(--ctp-primary)]"></div>
				</div>
			</div>
		</div>
	);
}
