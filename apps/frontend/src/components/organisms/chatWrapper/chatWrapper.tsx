import type { ChatHeader } from "@/components/molecules/chatHeader";
import { chatEvalFlag } from "@/flags";
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
	const isChatEnabled = await chatEvalFlag();

	if (!isChatEnabled) {
		return null;
	}

	return (
		<ChatClientWrapper header={header} placeholderTexts={placeholderTexts} />
	);
}
