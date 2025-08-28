import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "../types";
import { getConfigWithEvaluations } from "./getConfig";

// Mock the database operations
const mockQuery = {
	agentConfigs: {
		findFirst: vi.fn(),
	},
};

const mockDb = {
	query: mockQuery,
} as unknown as Database;

describe("getConfig queries", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getConfigWithEvaluations", () => {
		it("should return config with evaluations", async () => {
			const mockConfig = {
				id: "test-config-1",
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
				createdAt: new Date(),
				updatedAt: new Date(),
				humanEvaluations: [],
				retrievalEvaluations: [],
				generationEvaluations: [],
				systemMetrics: [],
			};

			mockQuery.agentConfigs.findFirst.mockResolvedValue(mockConfig);

			const result = await getConfigWithEvaluations("test-config-1", mockDb);

			expect(result).toEqual(mockConfig);
			expect(mockQuery.agentConfigs.findFirst).toHaveBeenCalledWith({
				where: expect.any(Object),
				with: {
					humanEvaluations: true,
					retrievalEvaluations: true,
					generationEvaluations: true,
					systemMetrics: true,
				},
			});
		});

		it("should return undefined if config not found", async () => {
			mockQuery.agentConfigs.findFirst.mockResolvedValue(undefined);

			const result = await getConfigWithEvaluations(
				"non-existent-config",
				mockDb,
			);

			expect(result).toBeUndefined();
			expect(mockQuery.agentConfigs.findFirst).toHaveBeenCalled();
		});

		it("should handle config with populated evaluations", async () => {
			const mockConfigWithEvaluations = {
				id: "test-config-1",
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
				createdAt: new Date(),
				updatedAt: new Date(),
				humanEvaluations: [
					{
						id: "eval-1",
						configId: "test-config-1",
						evaluationSet: 1,
						evaluatorId: "evaluator-123",
						recommendationQuality: 4,
						explanationClarity: 5,
						relevanceToProfile: 3,
						courseVariety: 4,
						trustworthiness: 5,
						overallSatisfaction: 4,
						evaluatedAt: new Date(),
						createdAt: new Date(),
					},
				],
				retrievalEvaluations: [
					{
						agentConfigId: "test-config-1",
						chatId: "chat-1",
						contextPrecision: 0.85,
						contextRecall: 0.9,
						contextF1: 0.87,
						mrr: 0.75,
						ndcg: 0.8,
						answerSimilarity: 0.88,
						faithfulness: 0.92,
						answerRelevancy: 0.85,
						answerCorrectness: 0.9,
						hitRate: 0.95,
						averagePrecision: 0.82,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				],
				generationEvaluations: [
					{
						agentConfigId: "test-config-1",
						chatId: "chat-1",
						llmAsJudge: true,
						generatedAnswerSimilarity: 0.9,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				],
				systemMetrics: [
					{
						agentConfigId: "test-config-1",
						chatId: "chat-1",
						totalLlmTokens: 1500,
						totalLlmTime: 2.5,
						llmCalls: 3,
						ragSearchCalls: 2,
						totalRagTime: 1.2,
						hasError: false,
						hasTimeout: false,
						totalRunTime: 3.7,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				],
			};

			mockQuery.agentConfigs.findFirst.mockResolvedValue(
				mockConfigWithEvaluations,
			);

			const result = await getConfigWithEvaluations("test-config-1", mockDb);

			expect(result).toEqual(mockConfigWithEvaluations);
			expect(result?.humanEvaluations).toHaveLength(1);
			expect(result?.retrievalEvaluations).toHaveLength(1);
			expect(result?.generationEvaluations).toHaveLength(1);
			expect(result?.systemMetrics).toHaveLength(1);
		});
	});
});
