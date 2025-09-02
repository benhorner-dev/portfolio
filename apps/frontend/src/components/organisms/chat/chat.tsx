"use client";

import { useEffect } from "react";
import { Input } from "@/components/atoms/input";
import type { ChatHeader } from "@/components/molecules/chatHeader";
import { ChatInput } from "@/components/molecules/chatInput";
import { Message } from "@/components/molecules/message";
import { MessageWrapper } from "@/components/molecules/message/messageWrapper";
import { SendButton } from "@/components/molecules/sendButton";
import { TypingIndicator } from "@/components/molecules/typingIndicator";
import { useChatInput } from "@/lib/hooks/useChatInput";
import { useChatMessages } from "@/lib/hooks/useChatMessages";
import { useChatScroll } from "@/lib/hooks/useChatScroll";
import type { ChatInput as ChatInputType } from "@/lib/schema";
import { MockChatService } from "@/lib/services/mockChatService";
import { ChatMessagesWrapper } from "../../molecules/chatMessagesWrapper/chatMessagesWrapper";
import { ChatWindowWrapper } from "../../molecules/chatWindowWrapper/chatWindowWrapper";

interface ChatProps {
	header: React.ReactElement<React.ComponentProps<typeof ChatHeader>>;
	placeholderTexts: ChatInputType["placeholder"];
}

export function Chat({ header, placeholderTexts }: ChatProps) {
	const { messages, sendMessage } = useChatMessages(new MockChatService());

	const { inputValue, isTyping, handleInputChange, handleSend } =
		useChatInput();
	const { messagesContainerRef, scrollToBottom } = useChatScroll();

	// biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom is stable from useChatScroll hook
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSendMessage = () => {
		if (handleSend()) {
			sendMessage(inputValue);
		}
	};

	const handleQuickReply = (reply: string) => {
		sendMessage(reply);
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !isTyping) {
			handleSendMessage();
		}
	};
	const input = (
		<Input
			placeholder={
				isTyping ? placeholderTexts.typing : placeholderTexts.default
			}
			value={inputValue}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
				handleInputChange(e.target.value)
			}
			onKeyDown={handleKeyPress}
			disabled={isTyping}
		/>
	);
	return (
		<ChatWindowWrapper data-auth-required="true">
			<div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/20 shadow-2xl overflow-hidden hover:animate-terminal-glow transition-all duration-500">
				{header}
				<ChatMessagesWrapper messagesContainerRef={messagesContainerRef}>
					{messages.map((message) => (
						<MessageWrapper key={message.id} isUser={message.isUser}>
							<Message
								msgId={message.id}
								text={message.text}
								isUser={message.isUser}
								quickReplies={message.quickReplies}
								onQuickReply={handleQuickReply}
								isTyping={isTyping}
							/>
						</MessageWrapper>
					))}

					{isTyping && <TypingIndicator />}
				</ChatMessagesWrapper>

				<ChatInput
					input={input}
					button={
						<SendButton onClick={handleSendMessage} disabled={isTyping} />
					}
				/>
			</div>
		</ChatWindowWrapper>
	);
}
