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
	const className = `w-full justify-start text-xs transition-all duration-300 ${
		isTyping
			? "bg-card/20 text-muted-foreground cursor-not-allowed opacity-50"
			: "bg-ctp-green/20 hover:bg-ctp-green/30 text-ctp-green hover:scale-105 cursor-pointer hover:text-ctp-green hover:ring-2 hover:ring-ctp-green/60 border border-ctp-green/30"
	}`;
	return (
		<>
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
		</>
	);
}
