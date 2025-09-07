import { useEffect } from "react";

import { Button } from "@/components/atoms/button";
import { MessageWrapper } from "@/components/molecules/message/messageWrapper";
import { Thoughts } from "@/components/molecules/thoughts";
import { TypingIndicator } from "@/components/molecules/typingIndicator";
import { InterlocutorType } from "@/lib/explore/constants";
import type { AgentServerAction, ChatMessage } from "@/lib/explore/types";
import { useChatInput } from "@/lib/hooks/useChatInput";
import { useChatMessages } from "@/lib/hooks/useChatMessages";
import { useChatStore } from "@/lib/stores/chatStore";
import { MarkdownWrapper } from "../markdownWrapper/markdownWrapper";

interface MessageProps {
	message: ChatMessage;
	action: AgentServerAction;
}

export function Message({ message, action }: MessageProps) {
	const { sendMessage } = useChatMessages(action);
	const { isTyping } = useChatInput();
	const { addMessages, markMessageAsSent, isMessageSent } = useChatStore();

	const { getThoughts } = useChatStore();
	const thoughts = getThoughts(message.id);

	useEffect(() => {
		if (message.content === null && !isMessageSent(message.id)) {
			markMessageAsSent(message.id);
			sendMessage(message);
		}
	}, [message, markMessageAsSent, isMessageSent, sendMessage]);
	const className = `w-full justify-start text-left text-xs transition-all duration-300 whitespace-normal break-words px-4 py-5 !h-auto min-h-[2rem] ${
		isTyping
			? "bg-card/20 text-muted-foreground cursor-not-allowed opacity-50"
			: "bg-ctp-green/20 hover:bg-ctp-green/30 text-ctp-green hover:scale-105 cursor-pointer hover:text-ctp-green hover:ring-2 hover:ring-ctp-green/60 border border-ctp-green/30"
	}`;

	return (
		<>
			{!message.content && <TypingIndicator message={message} />}
			{thoughts.length > 0 && (
				<Thoughts thoughts={thoughts} message={message} />
			)}
			{message.content !== null && (
				<MessageWrapper isUser={message.type === InterlocutorType.HUMAN}>
					<MarkdownWrapper text={message.content} />
					{message.quickReplies && message.quickReplies.length > 0 && (
						<div className="mt-3 space-y-2">
							{message.quickReplies.map((reply) => (
								<Button
									key={`${message.timestamp}-reply-${reply}`}
									variant="ghost"
									size="sm"
									onClick={() =>
										addMessages([
											{
												id: crypto.randomUUID(),
												content: reply,
												type: InterlocutorType.HUMAN,
												timestamp: new Date().toISOString(),
												thoughts: [],
												quickReplies: [],
											},
											{
												id: crypto.randomUUID(),
												content: null,
												type: InterlocutorType.AI,
												timestamp: new Date().toISOString(),
												thoughts: [],
												quickReplies: [],
												inputValue: reply,
											},
										])
									}
									disabled={isTyping}
									className={className}
								>
									{reply}
								</Button>
							))}
						</div>
					)}
				</MessageWrapper>
			)}
		</>
	);
}
