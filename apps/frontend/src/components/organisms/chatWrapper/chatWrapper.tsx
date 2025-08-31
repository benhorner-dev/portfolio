import { FeatureFlag } from "@/app/constants";
import type { ChatHeader } from "@/components/molecules/chatHeader";
import { createFeatureFlag } from "@/flags";
import type { ChatInput } from "@/lib/schema";
import { ChatClientWrapper } from "./chatClientWrapper";

interface ChatWrapperProps {
	header: React.ReactElement<React.ComponentProps<typeof ChatHeader>>;
	placeholderTexts: ChatInput["placeholder"];
}

export async function ChatWrapper({
	header,
	placeholderTexts,
}: ChatWrapperProps) {
	const isChatEnabled = await createFeatureFlag(FeatureFlag.CHAT)();

	if (!isChatEnabled) {
		return null;
	}

	return (
		<ChatClientWrapper header={header} placeholderTexts={placeholderTexts} />
	);
}
