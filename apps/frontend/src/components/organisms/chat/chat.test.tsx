import type { StreamableValue } from "@ai-sdk/rsc";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { Chat } from "@/components/organisms/chat";
import type {
	AgentResponse,
	AgentServerAction,
	ChatMessage,
} from "@/lib/explore/types";

vi.useFakeTimers();

vi.mock("@/lib/hooks/useChatInput", () => ({
	useChatInput: vi.fn(),
}));

vi.mock("@/lib/hooks/useChatMessages", () => ({
	useChatMessages: vi.fn(),
}));

vi.mock("@/lib/hooks/useChatScroll", () => ({
	useChatScroll: vi.fn(),
}));

vi.mock("@/lib/stores/chatStore", () => ({
	useChatStore: vi.fn(() => ({
		quickReplies: [],
		setQuickReplies: vi.fn(),
		addMessages: vi.fn(),
		markMessageAsSent: vi.fn(),
		isMessageSent: vi.fn(() => false),
		getThoughts: vi.fn(() => []),
	})),
}));

beforeEach(async () => {
	cleanup();

	vi.clearAllTimers();

	const { useChatInput } = await import("@/lib/hooks/useChatInput");
	const { useChatMessages } = await import("@/lib/hooks/useChatMessages");
	const { useChatScroll } = await import("@/lib/hooks/useChatScroll");

	vi.mocked(useChatInput).mockReturnValue({
		inputValue: "",
		isTyping: false,
		handleInputChange: vi.fn(),
		handleSend: vi.fn(() => true),
	});

	vi.mocked(useChatMessages).mockReturnValue({
		messages: [],
		sendMessage: vi.fn(),
	});

	vi.mocked(useChatScroll).mockReturnValue({
		messagesContainerRef: {
			current: {
				scrollTo: vi.fn(),
				scrollTop: 0,
				scrollHeight: 100,
				clientHeight: 50,
			} as unknown as HTMLDivElement,
		},
		scrollToBottom: vi.fn(),
	});
});

const mockHeader = <div data-testid="chat-header">Chat Header</div>;
const mockAction: AgentServerAction = () =>
	Promise.resolve({
		type: "text",
		text: "Hello",
	} as StreamableValue<AgentResponse>);

it("Chat renders header", () => {
	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	expect(screen.getByTestId("chat-header")).toBeInTheDocument();
});

it("Chat renders input with default placeholder", () => {
	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	expect(screen.getByPlaceholderText("Type a message")).toBeInTheDocument();
});

it("Chat renders input with typing placeholder when isTyping is true", async () => {
	const { useChatInput } = await import("@/lib/hooks/useChatInput");
	vi.mocked(useChatInput).mockReturnValue({
		inputValue: "",
		isTyping: true,
		handleInputChange: vi.fn(),
		handleSend: vi.fn(() => true),
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	expect(screen.getByPlaceholderText("AI is typing...")).toBeInTheDocument();
});

it("Chat renders messages when messages exist", async () => {
	const mockMessages = [
		{
			id: "1",
			content: "Hello",
			type: "human",
			timestamp: new Date().toISOString(),
			thoughts: [],
		},
		{
			id: "2",
			content: "Hi there!",
			type: "ai",
			timestamp: new Date().toISOString(),
			thoughts: [],
		},
		{
			id: "3",
			content: null,
			type: "ai",
			timestamp: new Date().toISOString(),
			thoughts: [],
		},
	];

	const { useChatMessages } = await import("@/lib/hooks/useChatMessages");
	vi.mocked(useChatMessages).mockReturnValue({
		messages: mockMessages as unknown as ChatMessage[],
		sendMessage: vi.fn(),
	});

	const { useChatStore } = await import("@/lib/stores/chatStore");
	vi.mocked(useChatStore).mockReturnValue({
		quickReplies: ["Thanks", "Goodbye"],
		setQuickReplies: vi.fn(),
		addMessages: vi.fn(),
		markMessageAsSent: vi.fn(),
		isMessageSent: vi.fn(() => false),
		getThoughts: vi.fn(() => []),
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	expect(screen.getByText("Hello")).toBeInTheDocument();
	expect(screen.getByText("Hi there!")).toBeInTheDocument();
});

it("Chat handles quick reply click", async () => {
	const mockSendMessage = vi.fn();
	const mockMessages = [
		{
			id: "1",
			content: "Hi there!",
			type: "ai",
			timestamp: new Date().toISOString(),
			thoughts: [],
			quickReplies: ["Thanks", "Goodbye"],
		},
	];

	const { useChatMessages } = await import("@/lib/hooks/useChatMessages");
	vi.mocked(useChatMessages).mockReturnValue({
		messages: mockMessages as unknown as ChatMessage[],
		sendMessage: mockSendMessage,
	});

	const { useChatStore } = await import("@/lib/stores/chatStore");
	vi.mocked(useChatStore).mockReturnValue({
		quickReplies: [],
		setQuickReplies: vi.fn(),
		addMessages: vi.fn(),
		markMessageAsSent: vi.fn(),
		isMessageSent: vi.fn(() => false),
		getThoughts: vi.fn(() => []),
		scrollPosition: 0,
		thoughts: [],
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	const quickReplyButton = screen.getByText("Thanks");
	quickReplyButton.click();

	expect(mockSendMessage).toHaveBeenCalledWith("Thanks");
});

it("Chat handles Enter key press when not typing", async () => {
	const mockSendMessage = vi.fn();

	const { useChatInput } = await import("@/lib/hooks/useChatInput");
	const { useChatMessages } = await import("@/lib/hooks/useChatMessages");

	vi.mocked(useChatInput).mockReturnValue({
		inputValue: "test message",
		isTyping: false,
		handleInputChange: vi.fn(),
		handleSend: vi.fn(() => true),
	});

	vi.mocked(useChatMessages).mockReturnValue({
		messages: [],
		sendMessage: mockSendMessage,
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	const input = screen.getByPlaceholderText("Type a message");
	fireEvent.keyDown(input, { key: "Enter" });

	expect(mockSendMessage).toHaveBeenCalledWith("test message");
});

it("Chat does not handle Enter key press when typing", async () => {
	const mockSendMessage = vi.fn();
	const mockHandleSend = vi.fn(() => true);

	const { useChatInput } = await import("@/lib/hooks/useChatInput");
	const { useChatMessages } = await import("@/lib/hooks/useChatMessages");

	vi.mocked(useChatInput).mockReturnValue({
		inputValue: "test message",
		isTyping: true,
		handleInputChange: vi.fn(),
		handleSend: mockHandleSend,
	});

	vi.mocked(useChatMessages).mockReturnValue({
		messages: [],
		sendMessage: mockSendMessage,
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	const input = screen.getByPlaceholderText("AI is typing...");
	fireEvent.keyDown(input, { key: "Enter" });

	expect(mockHandleSend).not.toHaveBeenCalled();
	expect(mockSendMessage).not.toHaveBeenCalled();
});

it("Chat handles non-Enter key press", async () => {
	const mockSendMessage = vi.fn();
	const mockHandleSend = vi.fn(() => true);

	const { useChatInput } = await import("@/lib/hooks/useChatInput");
	const { useChatMessages } = await import("@/lib/hooks/useChatMessages");

	vi.mocked(useChatInput).mockReturnValue({
		inputValue: "test message",
		isTyping: false,
		handleInputChange: vi.fn(),
		handleSend: mockHandleSend,
	});

	vi.mocked(useChatMessages).mockReturnValue({
		messages: [],
		sendMessage: mockSendMessage,
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	const input = screen.getByPlaceholderText("Type a message");
	fireEvent.keyDown(input, { key: "Space" });

	expect(mockHandleSend).not.toHaveBeenCalled();
	expect(mockSendMessage).not.toHaveBeenCalled();
});

it("Chat handles send button click", async () => {
	const mockSendMessage = vi.fn();
	const mockHandleSend = vi.fn(() => true);

	const { useChatInput } = await import("@/lib/hooks/useChatInput");
	const { useChatMessages } = await import("@/lib/hooks/useChatMessages");

	vi.mocked(useChatInput).mockReturnValue({
		inputValue: "test message",
		isTyping: false,
		handleInputChange: vi.fn(),
		handleSend: mockHandleSend,
	});

	vi.mocked(useChatMessages).mockReturnValue({
		messages: [],
		sendMessage: mockSendMessage,
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	const sendButton = screen.getByText("Send");
	sendButton.click();

	expect(mockHandleSend).toHaveBeenCalled();
	expect(mockSendMessage).toHaveBeenCalledWith("test message");
});

it("Chat handles send button click when handleSend returns false", async () => {
	const mockSendMessage = vi.fn();
	const mockHandleSend = vi.fn(() => false);

	const { useChatInput } = await import("@/lib/hooks/useChatInput");
	const { useChatMessages } = await import("@/lib/hooks/useChatMessages");

	vi.mocked(useChatInput).mockReturnValue({
		inputValue: "test message",
		isTyping: false,
		handleInputChange: vi.fn(),
		handleSend: mockHandleSend,
	});

	vi.mocked(useChatMessages).mockReturnValue({
		messages: [],
		sendMessage: mockSendMessage,
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	const sendButton = screen.getByText("Send");
	sendButton.click();

	expect(mockHandleSend).toHaveBeenCalled();
	expect(mockSendMessage).not.toHaveBeenCalled();
});

it("Chat shows typing indicator when isTyping is true and no messages", async () => {
	vi.resetModules();

	const { useChatInput } = await import("@/lib/hooks/useChatInput");
	const { useChatMessages } = await import("@/lib/hooks/useChatMessages");

	vi.mocked(useChatInput).mockReturnValue({
		inputValue: "",
		isTyping: true,
		handleInputChange: vi.fn(),
		handleSend: vi.fn(() => true),
	});

	vi.mocked(useChatMessages).mockReturnValue({
		messages: [],
		sendMessage: vi.fn(),
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	expect(screen.getByPlaceholderText("AI is typing...")).toBeInTheDocument();
});

it("Chat handles input change", async () => {
	const mockHandleInputChange = vi.fn();

	const { useChatInput } = await import("@/lib/hooks/useChatInput");
	vi.mocked(useChatInput).mockReturnValue({
		inputValue: "",
		isTyping: false,
		handleInputChange: mockHandleInputChange,
		handleSend: vi.fn(() => true),
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	const input = screen.getByPlaceholderText("Type a message");
	fireEvent.change(input, { target: { value: "test input" } });

	expect(mockHandleInputChange).toHaveBeenCalledWith("test input");
});

it("Chat clears scroll timeout on multiple renders", async () => {
	const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
	const setTimeoutSpy = vi.spyOn(global, "setTimeout");

	const { useChatScroll } = await import("@/lib/hooks/useChatScroll");
	const { useChatStore } = await import("@/lib/stores/chatStore");

	vi.mocked(useChatScroll).mockReturnValue({
		messagesContainerRef: {
			current: {
				scrollTo: vi.fn(),
				scrollTop: 0,
				scrollHeight: 100,
				clientHeight: 50,
			} as unknown as HTMLDivElement,
		},
		scrollToBottom: vi.fn(),
	});

	vi.mocked(useChatStore).mockReturnValue({
		quickReplies: [],
		setQuickReplies: vi.fn(),
		addMessages: vi.fn(),
		markMessageAsSent: vi.fn(),
		isMessageSent: vi.fn(() => false),
		getThoughts: vi.fn(() => []),
		scrollPosition: 100,
		thoughts: [],
	});

	const { rerender } = render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	rerender(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
			action={mockAction}
		/>,
	);

	clearTimeoutSpy.mockRestore();
	setTimeoutSpy.mockRestore();
});
