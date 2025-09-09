"use client";
import { ErrorBoundary } from "@sentry/nextjs";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { ErrorFallback } from "@/components/atoms/errorFallback";
import type { ChatHeader } from "@/components/molecules/chatHeader";
import { agent } from "@/lib/explore/agent/agent";
import type { AgentConfig } from "@/lib/explore/types";
import type { ChatInput } from "@/lib/schema";
import { useChatStore } from "@/lib/stores/chatStore";

interface ChatClientWrapperProps {
	header: React.ReactElement<React.ComponentProps<typeof ChatHeader>>;
	placeholderTexts: ChatInput["placeholder"];
	config: AgentConfig;
	chatId?: string;
}

const Chat = dynamic(
	() =>
		import("@/components/organisms/chat").then((mod) => ({
			default: mod.Chat,
		})),
	{
		ssr: false,
	},
);

export function ChatClientWrapper({
	chatId,
	header,
	placeholderTexts,
	config,
}: ChatClientWrapperProps) {
	useEffect(() => {
		if (chatId) {
			useChatStore.getState().setChatId(chatId);
		}
		useChatStore.getState().setConfig(config);
	}, [chatId, config]);

	return (
		<ErrorBoundary fallback={ErrorFallback}>
			<Chat
				header={header}
				placeholderTexts={placeholderTexts}
				action={agent}
			/>
		</ErrorBoundary>
	);
}
