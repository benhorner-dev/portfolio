"use client";

import { ErrorBoundary } from "@sentry/nextjs";
import dynamic from "next/dynamic";
import { ErrorFallback } from "@/components/atoms/errorFallback";
import type { ChatHeader } from "@/components/molecules/chatHeader";
import type { ChatInput } from "@/lib/schema";

interface ChatClientWrapperProps {
	header: React.ReactElement<React.ComponentProps<typeof ChatHeader>>;
	placeholderTexts: ChatInput["placeholder"];
}

export function ChatClientWrapper({
	header,
	placeholderTexts,
}: ChatClientWrapperProps) {
	const Chat = dynamic(
		() =>
			import("@/components/organisms/chat").then((mod) => ({
				default: mod.Chat,
			})),
		{
			ssr: false,
		},
	);
	return (
		<ErrorBoundary fallback={ErrorFallback}>
			<Chat header={header} placeholderTexts={placeholderTexts} />
		</ErrorBoundary>
	);
}
