import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatScroll } from "./useChatScroll";

vi.useFakeTimers();

describe("useChatScroll", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns messagesContainerRef and scrollToBottom function", () => {
		const { result } = renderHook(() => useChatScroll());

		expect(result.current.messagesContainerRef).toBeDefined();
		expect(result.current.scrollToBottom).toBeDefined();
	});

	it("scrolls to bottom when scrollToBottom is called", () => {
		const { result } = renderHook(() => useChatScroll());
		const mockScrollTo = vi.fn();

		const mockElement = {
			scrollTo: mockScrollTo,
			scrollHeight: 1000,
		};

		result.current.messagesContainerRef.current =
			mockElement as unknown as HTMLDivElement;

		act(() => {
			result.current.scrollToBottom();
		});

		vi.advanceTimersByTime(50);

		expect(mockScrollTo).toHaveBeenCalledWith({
			top: 1000,
			behavior: "smooth",
		});
	});

	it("does not scroll when ref is null", () => {
		const { result } = renderHook(() => useChatScroll());

		act(() => {
			result.current.scrollToBottom();
		});

		vi.advanceTimersByTime(50);

		expect(result.current.messagesContainerRef.current).toBeNull();
	});
});
