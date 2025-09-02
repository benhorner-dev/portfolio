interface ChatMessagesWrapperProps {
	children: React.ReactNode;
	messagesContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessagesWrapper({
	children,
	messagesContainerRef,
}: ChatMessagesWrapperProps) {
	return (
		<div
			ref={messagesContainerRef}
			className="h-80 overflow-y-auto p-6 space-y-4 scroll-smooth bg-transparent"
		>
			{children}
		</div>
	);
}
