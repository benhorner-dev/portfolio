import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCache } from "./cache";
import { readCacheHistory, writeChatHistory } from "./chatHistory";

vi.mock("./cache");
vi.mock("@langchain/openai");
vi.mock("@/lib/explore/constants", () => ({
	InterlocutorType: {
		HUMAN: "human",
		AI: "ai",
	},
}));

const mockCache = {
	get: vi.fn(),
	set: vi.fn(),
} as any;

const mockLLM = {
	invoke: vi.fn(),
} as any;

describe("Chat History Functions", () => {
	beforeEach(() => {
		vi.mocked(getCache).mockResolvedValue(mockCache);
		vi.mocked(ChatOpenAI).mockImplementation(() => mockLLM);
		mockLLM.invoke.mockResolvedValue({ content: "Mocked summary" });
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("writeChatHistory", () => {
		it("should write chat history with empty existing history", async () => {
			mockCache.get.mockResolvedValue("");

			await writeChatHistory("chat123", "AI response", "User message");

			expect(mockCache.get).toHaveBeenCalledWith("chat_summary_chat123");
			expect(mockLLM.invoke).toHaveBeenCalledWith([
				expect.any(SystemMessage),
				expect.any(HumanMessage),
			]);
			expect(mockCache.set).toHaveBeenCalledWith(
				"chat_summary_chat123",
				"Mocked summary",
			);
		});

		it("should write chat history with existing history", async () => {
			mockCache.get.mockResolvedValue("Previous conversation summary");

			await writeChatHistory("chat456", "New AI response", "New user message");

			const expectedContent = `Existing History:
    Previous conversation summary
    First New Message:
    type:human, content: New user message
    Second New Message:
    type:ai, content: New AI response`;

			expect(mockLLM.invoke).toHaveBeenCalledWith([
				expect.objectContaining({
					content: expect.stringContaining(
						"You are a helpful assistant that summarizes chat conversations",
					),
				}),
				expect.objectContaining({
					content: `Please summarize the following chat conversation:\n\n${expectedContent}`,
				}),
			]);
		});

		it("should handle null existing history", async () => {
			mockCache.get.mockResolvedValue(null);

			await writeChatHistory("chat789", "AI message", "User message");

			expect(mockCache.set).toHaveBeenCalledWith(
				"chat_summary_chat789",
				"Mocked summary",
			);
		});

		it("should create proper LLM instance with correct configuration", async () => {
			mockCache.get.mockResolvedValue("");

			await writeChatHistory("chat123", "AI response", "User message");

			expect(ChatOpenAI).toHaveBeenCalledWith({
				modelName: "gpt-4o-mini",
				temperature: 0,
				openAIApiKey: process.env.OPENAI_API_KEY,
			});
		});

		it("should format messages correctly for LLM", async () => {
			mockCache.get.mockResolvedValue("Old history");

			await writeChatHistory("chat123", "AI says hello", "User says hi");

			const [systemMessage, humanMessage] = mockLLM.invoke.mock.calls[0][0];

			expect(systemMessage).toBeInstanceOf(SystemMessage);
			expect(systemMessage.content).toContain("summarizes chat conversations");
			expect(systemMessage.content).toContain("Main topics discussed");
			expect(systemMessage.content).toContain("2-4 paragraphs");

			expect(humanMessage).toBeInstanceOf(HumanMessage);
			expect(humanMessage.content).toContain(
				"Please summarize the following chat conversation",
			);
			expect(humanMessage.content).toContain(
				"type:human, content: User says hi",
			);
			expect(humanMessage.content).toContain("type:ai, content: AI says hello");
		});
	});

	describe("readCacheHistory", () => {
		it("should return existing cache history", async () => {
			const expectedHistory = "Cached conversation summary";
			mockCache.get.mockResolvedValue(expectedHistory);

			const result = await readCacheHistory("chat123");

			expect(mockCache.get).toHaveBeenCalledWith("chat_summary_chat123");
			expect(result).toBe(expectedHistory);
		});

		it("should return empty string when no cache exists", async () => {
			mockCache.get.mockResolvedValue(null);

			const result = await readCacheHistory("chat456");

			expect(result).toBe("");
		});

		it("should return empty string when cache returns undefined", async () => {
			mockCache.get.mockResolvedValue(undefined);

			const result = await readCacheHistory("chat789");

			expect(result).toBe("");
		});
	});

	describe("Error handling", () => {
		it("should handle cache get errors in writeChatHistory", async () => {
			mockCache.get.mockRejectedValue(new Error("Cache error"));

			await expect(
				writeChatHistory("chat123", "AI response", "User message"),
			).rejects.toThrow("Cache error");
		});

		it("should handle LLM invoke errors", async () => {
			mockCache.get.mockResolvedValue("");
			mockLLM.invoke.mockRejectedValue(new Error("LLM error"));

			await expect(
				writeChatHistory("chat123", "AI response", "User message"),
			).rejects.toThrow("LLM error");
		});

		it("should complete successfully even if cache set fails", async () => {
			mockCache.get.mockResolvedValue("");
			mockCache.set.mockRejectedValue(new Error("Cache set error"));

			await expect(
				writeChatHistory("chat123", "AI response", "User message"),
			).resolves.toBeUndefined();

			expect(mockCache.set).toHaveBeenCalledWith(
				"chat_summary_chat123",
				"Mocked summary",
			);
		});

		it("should handle cache get errors in readCacheHistory", async () => {
			mockCache.get.mockRejectedValue(new Error("Cache read error"));

			await expect(readCacheHistory("chat123")).rejects.toThrow(
				"Cache read error",
			);
		});
	});

	describe("Integration scenarios", () => {
		it("should handle multiple writes to same chat ID", async () => {
			mockCache.get
				.mockResolvedValueOnce("")
				.mockResolvedValueOnce("First summary");

			await writeChatHistory("chat123", "First AI", "First User");
			await writeChatHistory("chat123", "Second AI", "Second User");

			expect(mockCache.set).toHaveBeenCalledTimes(2);
			expect(mockCache.set).toHaveBeenNthCalledWith(
				1,
				"chat_summary_chat123",
				"Mocked summary",
			);
			expect(mockCache.set).toHaveBeenNthCalledWith(
				2,
				"chat_summary_chat123",
				"Mocked summary",
			);
		});

		it("should handle different chat IDs independently", async () => {
			mockCache.get.mockResolvedValue("");

			await writeChatHistory("chat1", "AI1", "User1");
			await writeChatHistory("chat2", "AI2", "User2");

			expect(mockCache.get).toHaveBeenCalledWith("chat_summary_chat1");
			expect(mockCache.get).toHaveBeenCalledWith("chat_summary_chat2");
			expect(mockCache.set).toHaveBeenCalledWith(
				"chat_summary_chat1",
				"Mocked summary",
			);
			expect(mockCache.set).toHaveBeenCalledWith(
				"chat_summary_chat2",
				"Mocked summary",
			);
		});
	});
});
