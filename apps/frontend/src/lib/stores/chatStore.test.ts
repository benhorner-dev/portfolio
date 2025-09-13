import { beforeEach, describe, expect, it } from "vitest";
import { InterlocutorType } from "@/lib/explore/constants";
import type { AgentConfig } from "@/lib/explore/types";
import { useChatStore } from "@/lib/stores/chatStore";

describe("chatStore", () => {
	beforeEach(() => {
		useChatStore.getState().resetChat();
	});

	it("has initial state", () => {
		const state = useChatStore.getState();
		expect(state.messages).toHaveLength(1);
		expect(state.inputValue).toBe("");
		expect(state.isTyping).toBe(false);
		expect(state.messages[0].content).toContain("Hi! I'm Ben");
	});

	it("sets input value", () => {
		useChatStore.getState().setInputValue("test input");
		expect(useChatStore.getState().inputValue).toBe("test input");
	});

	it("adds message", () => {
		const message = {
			id: "2",
			content: "Test message",
			type: InterlocutorType.HUMAN,
			timestamp: new Date().toISOString(),
			thoughts: [],
			quickReplies: [],
		};

		useChatStore.getState().addMessages([message]);
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
		useChatStore.getState().addMessages([
			{
				id: "2",
				content: "Test",
				type: InterlocutorType.HUMAN,
				timestamp: new Date().toDateString(),
				thoughts: [],
			},
		]);
		useChatStore.getState().setIsTyping(true);

		useChatStore.getState().resetChat();

		const state = useChatStore.getState();
		expect(state.messages).toHaveLength(1);
		expect(state.inputValue).toBe("");
		expect(state.isTyping).toBe(false);
	});

	it("updates message by id", () => {
		const originalMessage = {
			id: "test-id",
			content: "Original content",
			type: InterlocutorType.HUMAN,
			timestamp: new Date().toISOString(),
			thoughts: [],
		};

		const updatedMessage = {
			id: "test-id",
			content: "Updated content",
			type: InterlocutorType.AI,
			timestamp: new Date().toISOString(),
			thoughts: [],
		};

		useChatStore.getState().addMessages([originalMessage]);

		useChatStore.getState().updateMessage("test-id", updatedMessage);

		const state = useChatStore.getState();
		const foundMessage = state.messages.find((m) => m.id === "test-id");
		expect(foundMessage).toEqual(updatedMessage);
		expect(foundMessage?.content).toBe("Updated content");
		expect(foundMessage?.type).toBe(InterlocutorType.AI);
	});

	it("updates thoughts for a message", () => {
		const messageId = "test-message-id";
		const thoughts = ["thought 1", "thought 2"];

		useChatStore.getState().updateThoughts(messageId, thoughts);

		const retrievedThoughts = useChatStore.getState().getThoughts(messageId);
		expect(retrievedThoughts).toEqual(thoughts);
	});

	it("returns empty array for thoughts when messageId not found", () => {
		const thoughts = useChatStore.getState().getThoughts("non-existent-id");
		expect(thoughts).toEqual([]);
	});

	it("marks message as sent and checks if message is sent", () => {
		const messageId = "test-message-id";

		expect(useChatStore.getState().isMessageSent(messageId)).toBe(false);

		useChatStore.getState().markMessageAsSent(messageId);

		expect(useChatStore.getState().isMessageSent(messageId)).toBe(true);
	});

	it("handles multiple sent messages", () => {
		const messageId1 = "message-1";
		const messageId2 = "message-2";

		useChatStore.getState().markMessageAsSent(messageId1);
		useChatStore.getState().markMessageAsSent(messageId2);

		expect(useChatStore.getState().isMessageSent(messageId1)).toBe(true);
		expect(useChatStore.getState().isMessageSent(messageId2)).toBe(true);

		expect(useChatStore.getState().isMessageSent("non-existent")).toBe(false);
	});

	it("sets and gets scroll position", () => {
		const scrollPosition = 100;

		useChatStore.getState().setScrollPosition(scrollPosition);
		expect(useChatStore.getState().scrollPosition).toBe(scrollPosition);

		useChatStore.getState().setScrollPosition(0);
	});

	it("sets and gets chat id", () => {
		const chatId = "test-chat-id";

		useChatStore.getState().setChatId(chatId);
		expect(useChatStore.getState().chatId).toBe(chatId);
	});

	it("sets and gets config", () => {
		const config = {
			model: "gpt-4",
			temperature: 0.7,
			maxTokens: 1000,
		};

		useChatStore.getState().setConfig(config as unknown as AgentConfig);
		expect(useChatStore.getState().config).toEqual(config);
	});

	it("resets scroll position on chat reset", () => {
		useChatStore.getState().setScrollPosition(100);
		useChatStore.getState().resetChat();
	});

	it("performs batch update", () => {
		useChatStore.getState().batchUpdate({
			inputValue: "batch input",
			isTyping: true,
			scrollPosition: 200,
			chatId: "batch-chat-id",
			config: {
				model: "gpt-4",
				temperature: 0.8,
				maxTokens: 2000,
			} as unknown as AgentConfig,
		});

		const state = useChatStore.getState();
		expect(state.inputValue).toBe("batch input");
		expect(state.isTyping).toBe(true);
		expect(state.scrollPosition).toBe(200);
		expect(state.chatId).toBe("batch-chat-id");
		expect(state.config).toEqual({
			model: "gpt-4",
			temperature: 0.8,
			maxTokens: 2000,
		});
	});
});
