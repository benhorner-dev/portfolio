import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { Chat } from "@/components/organisms/chat";

vi.mock("@/lib/hooks/useChatInput", () => ({
	useChatInput: vi.fn(),
}));

vi.mock("@/lib/hooks/useChatMessages", () => ({
	useChatMessages: vi.fn(),
}));

vi.mock("@/lib/hooks/useChatScroll", () => ({
	useChatScroll: vi.fn(),
}));

beforeEach(async () => {
	cleanup();

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
		messagesContainerRef: { current: null },
		scrollToBottom: vi.fn(),
	});
});

const mockHeader = <div data-testid="chat-header">Chat Header</div>;

it("Chat renders header", () => {
	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
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
		/>,
	);

	expect(screen.getByPlaceholderText("AI is typing...")).toBeInTheDocument();
});

it("Chat renders messages when messages exist", async () => {
	const mockMessages = [
		{
			id: "1",
			text: "Hello",
			isUser: true,
			timestamp: new Date(),
			quickReplies: [],
		},
		{
			id: "2",
			text: "Hi there!",
			isUser: false,
			timestamp: new Date(),
			quickReplies: ["Thanks", "Goodbye"],
		},
	];

	const { useChatMessages } = await import("@/lib/hooks/useChatMessages");
	vi.mocked(useChatMessages).mockReturnValue({
		messages: mockMessages,
		sendMessage: vi.fn(),
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
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
			text: "Hi there!",
			isUser: false,
			timestamp: new Date(),
			quickReplies: ["Thanks", "Goodbye"],
		},
	];

	const { useChatMessages } = await import("@/lib/hooks/useChatMessages");
	vi.mocked(useChatMessages).mockReturnValue({
		messages: mockMessages,
		sendMessage: mockSendMessage,
	});

	render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
		/>,
	);

	const quickReplyButton = screen.getByText("Thanks");
	quickReplyButton.click();

	expect(mockSendMessage).toHaveBeenCalledWith("Thanks");
});

it("Chat handles Enter key press when not typing", async () => {
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
		/>,
	);

	const input = screen.getByPlaceholderText("Type a message");
	fireEvent.keyDown(input, { key: "Enter" });

	expect(mockHandleSend).toHaveBeenCalled();
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

	const { container } = render(
		<Chat
			header={mockHeader}
			placeholderTexts={{
				default: "Type a message",
				typing: "AI is typing...",
			}}
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
		/>,
	);

	const input = screen.getByPlaceholderText("Type a message");
	fireEvent.change(input, { target: { value: "test input" } });

	expect(mockHandleInputChange).toHaveBeenCalledWith("test input");
});
