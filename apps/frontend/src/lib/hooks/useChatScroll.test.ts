import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatScroll } from "./useChatScroll";

vi.useFakeTimers();

const mockSetScrollPosition = vi.fn();

vi.mock("../stores/chatStore", () => ({
	useChatStore: vi.fn(() => ({
		setScrollPosition: mockSetScrollPosition,
	})),
}));

describe("useChatScroll", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns messagesContainerRef and handleScroll function", () => {
		const { result } = renderHook(() => useChatScroll());

		expect(result.current.messagesContainerRef).toBeDefined();
		expect(result.current.scrollToBottom).toBeDefined();
	});

	it("does not call setScrollPosition when ref.current is null", () => {
		const { result } = renderHook(() => useChatScroll());

		result.current.messagesContainerRef.current = null;

		result.current.scrollToBottom();

		expect(mockSetScrollPosition).not.toHaveBeenCalled();
	});

	it("scrolls to bottom when ref.current exists", () => {
		const { result } = renderHook(() => useChatScroll());

		const mockScrollTo = vi.fn();
		const mockElement = {
			scrollTo: mockScrollTo,
			scrollHeight: 1000,
		} as unknown as HTMLDivElement;

		result.current.messagesContainerRef.current = mockElement;

		result.current.scrollToBottom();

		vi.advanceTimersByTime(50);

		expect(mockScrollTo).toHaveBeenCalledWith({
			top: 1000,
			behavior: "smooth",
		});
	});
});
