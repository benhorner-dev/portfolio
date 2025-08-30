import { Button } from "@/components/atoms/button";
import { TypographyP } from "@/components/atoms/p";

interface MessageProps {
	msgId: string;
	text: string;
	isUser: boolean;
	quickReplies?: string[];
	onQuickReply: (reply: string) => void;
	isTyping: boolean;
}

export function Message({
	msgId,
	text,
	isUser,
	quickReplies,
	onQuickReply,
	isTyping,
}: MessageProps) {
	const className = `w-full justify-start text-xs ${
		isTyping
			? "bg-card/20 text-muted-foreground cursor-not-allowed"
			: "bg-card/30 hover:bg-card/40 text-foreground hover:scale-105 cursor-pointer"
	}`;
	return (
		<div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
			<div
				className={`backdrop-blur-sm rounded-2xl px-4 py-3 max-w-xs ${
					isUser ? "bg-accent/20" : "bg-primary/20"
				}`}
			>
				<TypographyP text={text} />

				{!isUser && quickReplies && (
					<div className="mt-3 space-y-2">
						{quickReplies.map((reply) => (
							<Button
								key={`${msgId}-reply-${reply}`}
								variant="ghost"
								size="sm"
								onClick={() => onQuickReply(reply)}
								disabled={isTyping}
								className={className}
							>
								{reply}
							</Button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
