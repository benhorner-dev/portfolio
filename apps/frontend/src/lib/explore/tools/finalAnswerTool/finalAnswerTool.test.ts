import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentGraphError } from "@/lib/explore/errors";
import type { FinalAnswerArgs } from "@/lib/explore/types";

vi.mock("@/lib/logger", () => ({
	getLogger: vi.fn(() => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	})),
}));

vi.mock("@langchain/core/tools", () => ({
	tool: vi.fn((fn, _) => fn),
}));

vi.mock("@/lib/explore/tools/utils", () => ({
	getToolConfig: vi.fn().mockResolvedValue({
		description: "Provide the final answer to the user",
		config: {
			jsonSpace: 2,
			errorMsg: "Error generating final answer tool output:",
		},
	}),
}));

describe("finalAnswerTool", () => {
	let finalAnswer: (input: FinalAnswerArgs) => Promise<string>;

	beforeEach(async () => {
		vi.clearAllMocks();
		const module = await import("./finalAnswerTool");
		finalAnswer = module.finalAnswer;
	});

	it("should return JSON stringified result on successful execution", async () => {
		const input = {
			answer: "This is the final answer",
			researchSteps: "Step 1: Research\nStep 2: Analyze\nStep 3: Conclude",
			suggestQuestionOne: "What are the key benefits?",
			suggestQuestionTwo: "How does this work?",
			suggestQuestionThree: "What are the alternatives?",
		};
		const expectedResult = JSON.stringify(
			{
				answer: "This is the final answer",
				researchSteps: "Step 1: Research\nStep 2: Analyze\nStep 3: Conclude",
				courseLinks: [
					"What are the key benefits?",
					"How does this work?",
					"What are the alternatives?",
				],
			},
			null,
			2,
		);
		const result = await finalAnswer(input);
		expect(result).toBe(expectedResult);
	});

	it("should throw AgentGraphError when JSON.stringify fails", async () => {
		const input = {
			answer: "test answer",
			researchSteps: "test steps",
			suggestQuestionOne: "Question 1?",
			suggestQuestionTwo: "Question 2?",
			suggestQuestionThree: "Question 3?",
		};
		const originalStringify = JSON.stringify;
		const mockError = new Error("JSON stringify failed");
		vi.spyOn(JSON, "stringify").mockImplementation(() => {
			throw mockError;
		});
		await expect(finalAnswer(input)).rejects.toThrow(AgentGraphError);
		await expect(finalAnswer(input)).rejects.toThrow(
			"Error generating final answer tool output: Error: JSON stringify failed",
		);
		JSON.stringify = originalStringify;
	});
});
