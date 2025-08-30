import { beforeEach, describe, expect, it } from "vitest";
import { useChatStore } from "./chatStore";

describe("chatStore", () => {
	beforeEach(() => {
		useChatStore.getState().resetChat();
	});

	it("has initial state", () => {
		const state = useChatStore.getState();
		expect(state.messages).toHaveLength(1);
		expect(state.inputValue).toBe("");
		expect(state.isTyping).toBe(false);
		expect(state.messages[0].text).toContain("Hi! I'm Ben");
	});

	it("sets input value", () => {
		useChatStore.getState().setInputValue("test input");
		expect(useChatStore.getState().inputValue).toBe("test input");
	});

	it("adds message", () => {
		const message = {
			id: "2",
			text: "Test message",
			isUser: true,
			timestamp: new Date(),
		};

		useChatStore.getState().addMessage(message);
		const state = useChatStore.getState();
		expect(state.messages).toHaveLength(2);
		expect(state.messages[1]).toEqual(message);
	});

	it("sets typing state", () => {
		useChatStore.getState().setIsTyping(true);
		expect(useChatStore.getState().isTyping).toBe(true);

		useChatStore.getState().setIsTyping(false);
		expect(useChatStore.getState().isTyping).toBe(false);
	});

	it("clears input", () => {
		useChatStore.getState().setInputValue("test");
		useChatStore.getState().clearInput();
		expect(useChatStore.getState().inputValue).toBe("");
	});

	it("resets chat to initial state", () => {
		useChatStore.getState().setInputValue("test");
		useChatStore.getState().addMessage({
			id: "2",
			text: "Test",
			isUser: true,
			timestamp: new Date(),
		});
		useChatStore.getState().setIsTyping(true);

		useChatStore.getState().resetChat();

		const state = useChatStore.getState();
		expect(state.messages).toHaveLength(1);
		expect(state.inputValue).toBe("");
		expect(state.isTyping).toBe(false);
	});
});
