interface MessageProps {
	isUser: boolean;
	children: React.ReactNode;
}

export function MessageWrapper({ isUser, children }: MessageProps) {
	return (
		<div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
			<div
				className={`terminal-frame backdrop-blur-sm rounded-2xl px-4 py-3 max-w-xs transition-all duration-300 hover:animate-terminal-glow ${
					isUser
						? "bg-ctp-blue/20 border-ctp-blue/40 text-ctp-blue"
						: "bg-ctp-mauve/20 border-ctp-mauve/40 text-ctp-mauve"
				}`}
			>
				{children}
			</div>
		</div>
	);
}
