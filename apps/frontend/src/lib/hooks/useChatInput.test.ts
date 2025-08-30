import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatStore } from "@/lib/stores/chatStore";
import { useChatInput } from "./useChatInput";

vi.mock("@/lib/stores/chatStore");

const mockUseChatStore = vi.mocked(useChatStore);

describe("useChatInput", () => {
	const mockStore = {
		inputValue: "",
		isTyping: false,
		setInputValue: vi.fn(),
		clearInput: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseChatStore.mockReturnValue(mockStore);
	});

	it("returns store values", () => {
		const { result } = renderHook(() => useChatInput());

		expect(result.current.inputValue).toBe("");
		expect(result.current.isTyping).toBe(false);
	});

	it("calls setInputValue when handleInputChange is called", () => {
		const { result } = renderHook(() => useChatInput());

		act(() => {
			result.current.handleInputChange("test input");
		});

		expect(mockStore.setInputValue).toHaveBeenCalledWith("test input");
	});

	it("returns false and does not clear input when handleSend is called with empty input", () => {
		mockStore.inputValue = "";
		const { result } = renderHook(() => useChatInput());

		let sendResult: boolean = false;
		act(() => {
			sendResult = result.current.handleSend();
		});

		expect(sendResult).toBe(false);
		expect(mockStore.clearInput).not.toHaveBeenCalled();
	});

	it("returns false and does not clear input when handleSend is called while typing", () => {
		mockStore.inputValue = "test";
		mockStore.isTyping = true;
		const { result } = renderHook(() => useChatInput());

		let sendResult: boolean = false;
		act(() => {
			sendResult = result.current.handleSend();
		});

		expect(sendResult).toBe(false);
		expect(mockStore.clearInput).not.toHaveBeenCalled();
	});

	it("returns true and clears input when handleSend is called with valid input", () => {
		mockStore.inputValue = "test input";
		mockStore.isTyping = false;
		const { result } = renderHook(() => useChatInput());

		let sendResult: boolean = false;
		act(() => {
			sendResult = result.current.handleSend();
		});

		expect(sendResult).toBe(true);
		expect(mockStore.clearInput).toHaveBeenCalled();
	});
});
