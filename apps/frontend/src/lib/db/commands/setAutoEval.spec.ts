import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Database,
	NewGenerationEvaluation,
	NewRetrievalEvaluation,
	NewSystemEvaluations,
} from "../types";
import {
	upsertGenerationEvaluations,
	upsertRetrievalEvaluation,
	upsertSystemEvaluations,
} from "./setAutoEval";

// Mock the database operations
const mockDb = {
	insert: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	onConflictDoUpdate: vi.fn().mockReturnThis(),
} as unknown as Database;

describe("setAutoEval commands", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("upsertRetrievalEvaluation", () => {
		it("should upsert retrieval evaluation and return identifiers", async () => {
			const evaluationData: NewRetrievalEvaluation = {
				agentConfigId: "test-config-1",
				chatId: "test-chat-1",
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
			};

			const result = await upsertRetrievalEvaluation(evaluationData, mockDb);

			expect(result).toEqual({
				agentConfigId: "test-config-1",
				chatId: "test-chat-1",
			});
		});
	});

	describe("upsertSystemEvaluations", () => {
		it("should upsert system evaluation and return identifiers", async () => {
			const evaluationData: NewSystemEvaluations = {
				agentConfigId: "test-config-1",
				chatId: "test-chat-1",
				totalLlmTokens: 1500,
				totalLlmTime: 2.5,
				llmCalls: 3,
				ragSearchCalls: 2,
				totalRagTime: 1.2,
				hasError: false,
				hasTimeout: false,
				totalRunTime: 3.7,
			};

			const result = await upsertSystemEvaluations(evaluationData, mockDb);

			expect(result).toEqual({
				agentConfigId: "test-config-1",
				chatId: "test-chat-1",
			});
		});
	});

	describe("upsertGenerationEvaluations", () => {
		it("should upsert generation evaluation and return identifiers", async () => {
			const evaluationData: NewGenerationEvaluation = {
				agentConfigId: "test-config-1",
				chatId: "test-chat-1",
				llmAsJudge: true,
				generatedAnswerSimilarity: 0.9,
			};

			const result = await upsertGenerationEvaluations(evaluationData, mockDb);

			expect(result).toEqual({
				agentConfigId: "test-config-1",
				chatId: "test-chat-1",
			});
		});
	});
});
