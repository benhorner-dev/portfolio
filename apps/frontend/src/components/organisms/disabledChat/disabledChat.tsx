import { Input } from "@/components/atoms/input";
import { TypographyP } from "@/components/atoms/p";
import type { ChatHeader } from "@/components/molecules/chatHeader";
import { ChatInput } from "@/components/molecules/chatInput";
import { ChatMessagesWrapper } from "@/components/molecules/chatMessagesWrapper";
import { ChatWindowWrapper } from "@/components/molecules/chatWindowWrapper";
import type { LoginOverlay } from "@/components/molecules/loginOverlay";
import { MessageWrapper } from "@/components/molecules/message/messageWrapper";
import { SendButton } from "@/components/molecules/sendButton";
import type { ChatInput as ChatInputType } from "@/lib/schema";

interface DisabledChatProps {
	header: React.ReactElement<React.ComponentProps<typeof ChatHeader>>;
	placeholderTexts: ChatInputType["placeholder"];
	overlay: React.ReactElement<React.ComponentProps<typeof LoginOverlay>>;
}

export function DisabledChat({
	header,
	placeholderTexts,
	overlay,
}: DisabledChatProps) {
	const MESSAGE_COUNT = 4;
	const MIN_RANDOM_LENGTH = 10;
	const MAX_RANDOM_LENGTH = 20;
	const ASCII_LOWERCASE_A = 97;
	const ALPHABET_SIZE = 26;

	return (
		<ChatWindowWrapper topLevelClassName="relative">
			<div className="bg-card backdrop-blur-sm rounded-2xl border border-border/20 shadow-2xl overflow-hidden transition-all duration-500 ">
				{header}

				<ChatMessagesWrapper>
					{Array.from({ length: MESSAGE_COUNT }, (_, index) => {
						const randomLength =
							Math.floor(Math.random() * MAX_RANDOM_LENGTH) + MIN_RANDOM_LENGTH;
						const randomChars = Array.from({ length: randomLength }, () =>
							String.fromCharCode(
								Math.floor(Math.random() * ALPHABET_SIZE) + ASCII_LOWERCASE_A,
							),
						).join("");
						const isUser = index % 2 === 0;

						return (
							<MessageWrapper key={randomChars} isUser={isUser}>
								<TypographyP text={randomChars} />
							</MessageWrapper>
						);
					})}
				</ChatMessagesWrapper>
				<ChatInput
					input={
						<Input
							placeholder={placeholderTexts.default}
							value=""
							disabled
							className="opacity-50 cursor-not-allowed"
						/>
					}
					button={<SendButton disabled={true} />}
				/>
			</div>
			{overlay}
		</ChatWindowWrapper>
	);
}
