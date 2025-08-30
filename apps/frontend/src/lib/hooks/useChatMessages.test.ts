import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatStore } from "@/lib/stores/chatStore";
import { useChatMessages, useMockChatMessages } from "./useChatMessages";

vi.mock("@/lib/stores/chatStore");
vi.mock("@/lib/services/mockChatService", () => ({
	MockChatService: vi.fn().mockImplementation(() => ({
		sendMessage: vi.fn(),
	})),
}));

const mockUseChatStore = vi.mocked(useChatStore);

describe("useChatMessages", () => {
	const mockStore = {
		messages: [],
		addMessage: vi.fn(),
		setIsTyping: vi.fn(),
	};

	const mockChatService = {
		sendMessage: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseChatStore.mockReturnValue(mockStore);
	});

	it("returns messages and sendMessage function", () => {
		const { result } = renderHook(() => useChatMessages(mockChatService));

		expect(result.current.messages).toBeDefined();
		expect(result.current.sendMessage).toBeDefined();
	});

	it("sends message and sets typing state", () => {
		const { result } = renderHook(() => useChatMessages(mockChatService));

		act(() => {
			result.current.sendMessage("test message");
		});

		expect(mockStore.addMessage).toHaveBeenCalledWith({
			id: expect.any(String),
			text: "test message",
			isUser: true,
			timestamp: expect.any(Date),
		});
		expect(mockStore.setIsTyping).toHaveBeenCalledWith(true);
		expect(mockChatService.sendMessage).toHaveBeenCalledWith(
			"test message",
			expect.any(Function),
		);
	});

	it("trims message text", () => {
		const { result } = renderHook(() => useChatMessages(mockChatService));

		act(() => {
			result.current.sendMessage("  test message  ");
		});

		expect(mockStore.addMessage).toHaveBeenCalledWith({
			id: expect.any(String),
			text: "test message",
			isUser: true,
			timestamp: expect.any(Date),
		});
	});

	it("handles bot response callback", () => {
		const { result } = renderHook(() => useChatMessages(mockChatService));

		act(() => {
			result.current.sendMessage("test message");
		});

		const callback = mockChatService.sendMessage.mock.calls[0][1];
		const botResponse = {
			id: "bot-1",
			text: "Bot response",
			isUser: false,
			timestamp: new Date(),
		};

		act(() => {
			callback(botResponse);
		});

		expect(mockStore.addMessage).toHaveBeenCalledWith(botResponse);
		expect(mockStore.setIsTyping).toHaveBeenCalledWith(false);
	});
});

describe("useMockChatMessages", () => {
	it("returns useChatMessages with MockChatService", () => {
		const { result } = renderHook(() => useMockChatMessages());

		expect(result.current.messages).toBeDefined();
		expect(result.current.sendMessage).toBeDefined();
	});
});
