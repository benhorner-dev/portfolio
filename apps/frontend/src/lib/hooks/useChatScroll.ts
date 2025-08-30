import { useCallback, useRef } from "react";

export const useChatScroll = () => {
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = useCallback(() => {
		setTimeout(() => {
			if (messagesContainerRef.current) {
				messagesContainerRef.current.scrollTo({
					top: messagesContainerRef.current.scrollHeight,
					behavior: "smooth",
				});
			}
		}, 50);
	}, []);

	return { messagesContainerRef, scrollToBottom };
};
