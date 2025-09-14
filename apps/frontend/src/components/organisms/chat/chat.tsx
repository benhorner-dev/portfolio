"use client";

import { useEffect } from "react";
import { Input } from "@/components/atoms/input";
import type { ChatHeader } from "@/components/molecules/chatHeader";
import { ChatInput } from "@/components/molecules/chatInput";
import { ChatMessagesWrapper } from "@/components/molecules/chatMessagesWrapper/chatMessagesWrapper";
import { ChatWindowWrapper } from "@/components/molecules/chatWindowWrapper/chatWindowWrapper";
import { Message } from "@/components/molecules/message";
import { SendButton } from "@/components/molecules/sendButton";
import { TypingIndicator } from "@/components/molecules/typingIndicator";
import type { AgentServerAction } from "@/lib/explore/types";
import { useChatInput } from "@/lib/hooks/useChatInput";
import { useChatMessages } from "@/lib/hooks/useChatMessages";
import { useChatScroll } from "@/lib/hooks/useChatScroll";
import type { ChatInput as ChatInputType } from "@/lib/schema";
import { useChatStore } from "@/lib/stores/chatStore";

interface ChatProps {
	header: React.ReactElement<React.ComponentProps<typeof ChatHeader>>;
	placeholderTexts: ChatInputType["placeholder"];
	action: AgentServerAction;
}

export function Chat({ header, placeholderTexts, action }: ChatProps) {
	const { inputValue, isTyping, handleInputChange, handleSend } =
		useChatInput();
	const { messagesContainerRef, scrollToBottom } = useChatScroll();
	const { messages, sendMessage } = useChatMessages(
		action,
		messagesContainerRef,
	);

	const { thoughts } = useChatStore();

	// biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom is stable from useChatScroll hook
	useEffect(() => {
		scrollToBottom();
	}, [messages, thoughts]);

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !isTyping) {
			sendMessage(inputValue);
		}
	};

	const handleSendMessage = () => {
		const messageContent = inputValue.trim();
		if (handleSend()) {
			sendMessage(messageContent);
		}
	};
	const input = (
		<Input
			placeholder={
				isTyping ? placeholderTexts.typing : placeholderTexts.default
			}
			value={inputValue}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
				handleInputChange(e.target.value);
			}}
			onKeyDown={handleKeyPress}
			disabled={isTyping}
		/>
	);

	const handleQuickReply = (reply: string) => {
		sendMessage(reply);
	};
	return (
		<ChatWindowWrapper data-auth-required="true">
			<div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/20 shadow-2xl overflow-hidden hover:animate-terminal-glow transition-all duration-500">
				{header}
				<ChatMessagesWrapper messagesContainerRef={messagesContainerRef}>
					{messages.map((message) => (
						<span key={message.id}>
							{message.content === null && (
								<TypingIndicator message={message} />
							)}

							<Message message={message} onQuickReply={handleQuickReply} />
						</span>
					))}
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
