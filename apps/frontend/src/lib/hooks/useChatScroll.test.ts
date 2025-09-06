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
		expect(result.current.handleScroll).toBeDefined();
	});

	it("calls setScrollPosition when handleScroll is called with valid ref", () => {
		const { result } = renderHook(() => useChatScroll());

		// Mock the ref to have a current value
		const mockDiv = { scrollTop: 100 } as HTMLDivElement;
		result.current.messagesContainerRef.current = mockDiv;

		// Call handleScroll
		result.current.handleScroll();

		expect(mockSetScrollPosition).toHaveBeenCalledWith(100);
	});

	it("does not call setScrollPosition when ref.current is null", () => {
		const { result } = renderHook(() => useChatScroll());

		// Ensure ref.current is null
		result.current.messagesContainerRef.current = null;

		// Call handleScroll
		result.current.handleScroll();

		expect(mockSetScrollPosition).not.toHaveBeenCalled();
	});
});
