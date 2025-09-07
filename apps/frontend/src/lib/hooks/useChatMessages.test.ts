import { readStreamableValue } from "@ai-sdk/rsc";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkDailyTokenCount,
	updateTokenCount,
} from "@/lib/explore/agent/tokenCount";
import { InterlocutorType } from "@/lib/explore/constants";
import { AgentGraphError } from "@/lib/explore/errors";
import { useChatStore } from "@/lib/stores/chatStore";
import { useChatMessages } from "./useChatMessages";

vi.mock("@/lib/stores/chatStore");
vi.mock("@/lib/explore/agent/tokenCount");
vi.mock("@ai-sdk/rsc");

const mockUseChatStore = vi.mocked(useChatStore);
const mockCheckDailyTokenCount = vi.mocked(checkDailyTokenCount);
const mockUpdateTokenCount = vi.mocked(updateTokenCount);
const mockReadStreamableValue = vi.mocked(readStreamableValue);

const mockMessages = [
	{
		id: "1",
		content: "Hello",
		type: InterlocutorType.HUMAN,
		inputValue: "Hello",
		thoughts: [],
		quickReplies: [],
	},
];

const mockConfig = {
	model: "gpt-4",
	temperature: 0.7,
};

const mockAction = vi.fn();

const mockGetState = vi.fn();

describe("useChatMessages", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseChatStore.mockReturnValue({
			messages: mockMessages,
			setIsTyping: vi.fn(),
			updateMessage: vi.fn(),
			updateThoughts: vi.fn(),
			chatId: "test-chat-id",
			config: mockConfig,
		});
		mockUseChatStore.getState = mockGetState;
		mockGetState.mockReturnValue({
			setScrollPosition: vi.fn(),
		});
		mockCheckDailyTokenCount.mockResolvedValue({
			id: "user-id",
			name: null,
			email: "test@example.com",
			tokens: 0,
			authId: "auth-id",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		mockUpdateTokenCount.mockResolvedValue({
			id: "user-id",
			name: null,
			email: "test@example.com",
			tokens: 100,
			authId: "auth-id",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		const mockAsyncIterable = {
			async *[Symbol.asyncIterator]() {},
		};
		mockReadStreamableValue.mockReturnValue(mockAsyncIterable);
	});

	it("should return messages and sendMessage function", () => {
		const { result } = renderHook(() => useChatMessages(mockAction));

		expect(result.current.messages).toEqual(mockMessages);
		expect(typeof result.current.sendMessage).toBe("function");
	});

	it("should throw error when chatId is missing", async () => {
		mockUseChatStore.mockReturnValue({
			messages: mockMessages,
			setIsTyping: vi.fn(),
			updateMessage: vi.fn(),
			updateThoughts: vi.fn(),
			chatId: null,
			config: mockConfig,
		});

		const { result } = renderHook(() => useChatMessages(mockAction));

		await expect(result.current.sendMessage(mockMessages[0])).rejects.toThrow(
			AgentGraphError,
		);
	});

	it("should throw error when config is missing", async () => {
		mockUseChatStore.mockReturnValue({
			messages: mockMessages,
			setIsTyping: vi.fn(),
			updateMessage: vi.fn(),
			updateThoughts: vi.fn(),
			chatId: "test-chat-id",
			config: null,
		});

		const { result } = renderHook(() => useChatMessages(mockAction));

		await expect(result.current.sendMessage(mockMessages[0])).rejects.toThrow(
			AgentGraphError,
		);
	});

	it("should throw error when inputValue is missing", async () => {
		const messageWithoutInput = { ...mockMessages[0], inputValue: "" };

		const { result } = renderHook(() => useChatMessages(mockAction));

		await expect(
			result.current.sendMessage(messageWithoutInput),
		).rejects.toThrow("Message input value is required");
	});

	it("should handle successful message sending", async () => {
		const mockResponse = {
			answer: "Test response",
			courseLinks: ["link1", "link2"],
			scratchPad: "Test thought",
			totalTokens: 100,
		};

		const mockAsyncIterable = {
			async *[Symbol.asyncIterator]() {
				yield mockResponse;
			},
		};

		mockReadStreamableValue.mockReturnValue(mockAsyncIterable);
		mockAction.mockResolvedValue(mockResponse);

		const { result } = renderHook(() => useChatMessages(mockAction));

		await act(async () => {
			await result.current.sendMessage(mockMessages[0]);
		});

		expect(mockCheckDailyTokenCount).toHaveBeenCalledWith("test-chat-id");
		expect(mockAction).toHaveBeenCalledWith(
			"Hello",
			mockConfig,
			mockMessages,
			"test-chat-id",
		);
		expect(mockUpdateTokenCount).toHaveBeenCalledWith({ id: "user-id" }, 100);
	});

	it("should handle stream errors", async () => {
		const mockError = new Error("Stream error");
		const mockAsyncIterable = {
			async *[Symbol.asyncIterator]() {
				yield { error: mockError };
			},
		};

		mockReadStreamableValue.mockReturnValue(mockAsyncIterable);

		const { result } = renderHook(() => useChatMessages(mockAction));

		await expect(result.current.sendMessage(mockMessages[0])).rejects.toThrow(
			"Stream error",
		);
	});

	it("should handle user facing errors", async () => {
		const userFacingError = new Error("User facing error");
		userFacingError.name = "UserFacingErrors";
		mockAction.mockRejectedValue(userFacingError);

		const { result } = renderHook(() => useChatMessages(mockAction));

		await act(async () => {
			await result.current.sendMessage(mockMessages[0]);
		});

		const mockStore = mockUseChatStore.mock.results[0].value;
		expect(mockStore.updateMessage).toHaveBeenCalledWith(
			mockMessages[0].id,
			expect.objectContaining({
				content: "User facing error",
			}),
		);
	});

	it("should update scroll position when messagesContainerRef is provided", async () => {
		const mockScrollTop = 100;
		const mockContainer = {
			scrollTop: mockScrollTop,
		} as HTMLDivElement;

		const messagesContainerRef = { current: mockContainer };

		const { result } = renderHook(() =>
			useChatMessages(mockAction, messagesContainerRef),
		);

		await act(async () => {
			await result.current.sendMessage(mockMessages[0]);
		});

		expect(mockGetState().setScrollPosition).toHaveBeenCalledWith(
			mockScrollTop,
		);
	});
});
