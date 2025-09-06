interface ChatMessagesWrapperProps {
	children: React.ReactNode;
	messagesContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessagesWrapper({
	children,
	messagesContainerRef,
	onScroll,
}: ChatMessagesWrapperProps & { onScroll?: () => void }) {
	return (
		<div
			ref={messagesContainerRef}
			onScroll={onScroll}
			className="h-80 overflow-y-auto p-6 space-y-4  bg-transparent"
		>
			{children}
		</div>
	);
}
