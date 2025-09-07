"use client";

import { useLayoutEffect, useRef } from "react";
import { Input } from "@/components/atoms/input";
import type { ChatHeader } from "@/components/molecules/chatHeader";
import { ChatInput } from "@/components/molecules/chatInput";
import { ChatMessagesWrapper } from "@/components/molecules/chatMessagesWrapper/chatMessagesWrapper";
import { ChatWindowWrapper } from "@/components/molecules/chatWindowWrapper/chatWindowWrapper";
import { Message } from "@/components/molecules/message";
import { SendButton } from "@/components/molecules/sendButton";
import { InterlocutorType } from "@/lib/explore/constants";
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
	const { messagesContainerRef, handleScroll } = useChatScroll();
	const { messages } = useChatMessages(action, messagesContainerRef);
	const { scrollPosition, thoughts, addMessages } = useChatStore();

	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	/* v8 ignore start */
	// biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom is stable from useChatScroll hook
	useLayoutEffect(() => {
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop = scrollPosition;

			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}

			scrollTimeoutRef.current = setTimeout(() => {
				if (messagesContainerRef.current) {
					const maxScroll =
						messagesContainerRef.current.scrollHeight -
						messagesContainerRef.current.clientHeight;

					messagesContainerRef.current.scrollTo({
						top: maxScroll,
						behavior: "smooth",
					});
				}
			}, 100);
		}
	}, [messagesContainerRef.current?.scrollHeight, thoughts]);
	/* v8 ignore stop */

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !isTyping) {
			handleSendMessage();
		}
	};

	const handleSendMessage = () => {
		const messageContent = inputValue.trim();
		if (handleSend()) {
			addMessages([
				{
					id: crypto.randomUUID(),
					content: messageContent,
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
					inputValue: messageContent,
				},
			]);
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
	return (
		<ChatWindowWrapper data-auth-required="true">
			<div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/20 shadow-2xl overflow-hidden hover:animate-terminal-glow transition-all duration-500">
				{header}
				<ChatMessagesWrapper
					messagesContainerRef={messagesContainerRef}
					onScroll={handleScroll}
				>
					{messages.map((message) => (
						<Message key={message.id} message={message} action={action} />
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
