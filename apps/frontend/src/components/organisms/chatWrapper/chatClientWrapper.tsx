"use client";

import { ErrorBoundary } from "@sentry/nextjs";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { ErrorFallback } from "@/components/atoms/errorFallback";
import { Fallback } from "@/components/atoms/fallback";
import type { ChatHeader } from "@/components/molecules/chatHeader";
import type { ChatInput } from "@/lib/schema";

const Chat = dynamic(
	() =>
		import("@/components/organisms/chat").then((mod) => ({
			default: mod.Chat,
		})),
	{
		ssr: false,
	},
);

interface ChatClientWrapperProps {
	header: React.ReactElement<React.ComponentProps<typeof ChatHeader>>;
	placeholderTexts: ChatInput["placeholder"];
}

export function ChatClientWrapper({
	header,
	placeholderTexts,
}: ChatClientWrapperProps) {
	return (
		<ErrorBoundary fallback={ErrorFallback}>
			<Suspense fallback={<Fallback />}>
				<Chat header={header} placeholderTexts={placeholderTexts} />
			</Suspense>
		</ErrorBoundary>
	);
}
