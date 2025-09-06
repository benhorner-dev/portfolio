import { useRef } from "react";
import { useChatStore } from "../stores/chatStore";

export const useChatScroll = () => {
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	const { setScrollPosition } = useChatStore();

	const handleScroll = () => {
		if (messagesContainerRef.current) {
			setScrollPosition(messagesContainerRef.current.scrollTop);
		}
	};

	return { messagesContainerRef, handleScroll };
};
