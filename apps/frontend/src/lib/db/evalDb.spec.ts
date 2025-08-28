import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
	upsertGenerationEvaluations,
	upsertRetrievalEvaluation,
	upsertSystemEvaluations,
} from "./commands/setAutoEval";
import { setConfig, updateConfig, upsertConfig } from "./commands/setConfig";
import { setHumanEval } from "./commands/setHumanEval";
import { getConfigWithEvaluations } from "./queries/getConfig";
import {
	agentConfigs,
	generationEvaluations,
	humanEvaluations,
	retrievalEvaluations,
	systemEvaluations,
} from "./schema";
import type {
	DatabaseError,
	DrizzleNewHumanEvaluation,
	PostgresError,
	TestHumanEvaluation,
} from "./types";
import { getDb } from "./utils";

const testDbUrl = process.env.DATABASE_URL;

if (!testDbUrl) {
	throw new Error("DATABASE_URL is not set");
}

const { db, close } = await getDb(testDbUrl);

export function isDatabaseError(error: unknown): error is DatabaseError {
	return error instanceof Error && "cause" in error;
}

export function isPostgresError(error: unknown): error is PostgresError {
	return (
		isDatabaseError(error) &&
		error.cause !== undefined &&
		"constraint_name" in error.cause &&
		typeof error.cause.constraint_name === "string"
	);
}

describe("Eval Schema Integration Tests", () => {
	const ogMockHumanEval = {
		configId: "test-config-1",
		evaluationSet: 1,
		evaluatorId: "evaluator-123",
		recommendationQuality: 1,
		explanationClarity: 1,
		relevanceToProfile: 1,
		courseVariety: 1,
		trustworthiness: 1,
		overallSatisfaction: 1,
	};

	afterAll(async () => {
		await close();
	});

	beforeEach(async () => {
		await db.delete(retrievalEvaluations);
		await db.delete(systemEvaluations);
		await db.delete(generationEvaluations);
		await db.delete(humanEvaluations);
		await db.delete(agentConfigs);
	});

	it("should successfully insert records into both tables", async () => {
		const configId = "test-config-1";
		await db.insert(agentConfigs).values({
			id: configId,
			configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
		});

		await db.insert(humanEvaluations).values({
			configId,
			evaluationSet: 1,
			evaluatorId: "evaluator-123",
			recommendationQuality: 4,
			explanationClarity: 5,
			relevanceToProfile: 3,
			courseVariety: 4,
			trustworthiness: 5,
			overallSatisfaction: 4,
		});

		const configs = await db.select().from(agentConfigs);
		const evaluations = await db.select().from(humanEvaluations);

		expect(configs).toHaveLength(1);
		expect(configs[0].id).toBe(configId);
		expect(evaluations).toHaveLength(1);
		expect(evaluations[0].configId).toBe(configId);
		expect(evaluations[0].recommendationQuality).toBe(4);
	});

	it("should not allow 2 identical config id records", async () => {
		const configId = "test-config-1";
		await db.insert(agentConfigs).values({
			id: configId,
			configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
		});

		const configId2 = "test-config-1";
		await expect(async () => {
			await db.insert(agentConfigs).values({
				id: configId2,
				configDetails: JSON.stringify({ model: "gpt-5", temperature: 0.7 }),
			});
		}).rejects.toThrow(/Failed query: insert into "eval"\."agent_configs"/i);
	});

	it("should not allow more than 2 human eval records to be related to a single config", async () => {
		const configId = "test-config-1";
		await db.insert(agentConfigs).values({
			id: configId,
			configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
		});

		await db.insert(humanEvaluations).values({
			configId,
			evaluationSet: 1,
			evaluatorId: "evaluator-123",
			recommendationQuality: 4,
			explanationClarity: 5,
			relevanceToProfile: 3,
			courseVariety: 4,
			trustworthiness: 5,
			overallSatisfaction: 4,
		});

		await db.insert(humanEvaluations).values({
			configId,
			evaluationSet: 2,
			evaluatorId: "evaluator-456",
			recommendationQuality: 5,
			explanationClarity: 4,
			relevanceToProfile: 4,
			courseVariety: 5,
			trustworthiness: 4,
			overallSatisfaction: 5,
		});
		try {
			await db.insert(humanEvaluations).values({
				configId,
				evaluationSet: 3,
				evaluatorId: "evaluator-789",
				recommendationQuality: 3,
				explanationClarity: 2,
				relevanceToProfile: 3,
				courseVariety: 2,
				trustworthiness: 3,
				overallSatisfaction: 3,
			});
			expect.fail("Should have thrown an error");
		} catch (error) {
			expect(isPostgresError(error) && error.cause.constraint_name).toBe(
				"evaluation_set_must_be_1_or_2",
			);
		}
	});

	it("should not allow any metric values less than 1 or more than 5", async () => {
		const keys = [
			"recommendationQuality",
			"explanationClarity",
			"relevanceToProfile",
			"courseVariety",
			"trustworthiness",
			"overallSatisfaction",
		];
		const constraints = [
			"recommendation_quality_must_be_1_to_5",
			"explanation_clarity_must_be_1_to_5",
			"relevance_to_profile_must_be_1_to_5",
			"course_variety_must_be_1_to_5",
			"trustworthiness_must_be_1_to_5",
			"overall_satisfaction_must_be_1_to_5",
		];
		let count = 0;
		for (const key of keys) {
			const mockHumanEval: TestHumanEvaluation = { ...ogMockHumanEval };
			const invalidValue =
				(mockHumanEval[key as keyof TestHumanEvaluation] as number) - 1;
			(mockHumanEval[key as keyof TestHumanEvaluation] as number) =
				invalidValue;
			mockHumanEval.configId = `test-config-${++count}`;

			(mockHumanEval[key as keyof TestHumanEvaluation] as number) =
				invalidValue + 7;
			try {
				await db.insert(humanEvaluations).values(mockHumanEval);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(isPostgresError(error) && error.cause.constraint_name).toBe(
					constraints[count - 1],
				);
			}
		}
	});
	it("should not allow any null values", async () => {
		const nullValueKeys = [
			"configId",
			"evaluationSet",
			"evaluatorId",
			"recommendationQuality",
			"explanationClarity",
			"relevanceToProfile",
			"courseVariety",
			"trustworthiness",
			"overallSatisfaction",
		];

		let count = 0;
		for (const key of nullValueKeys) {
			const mockHumanEval: TestHumanEvaluation = { ...ogMockHumanEval };
			const invalidValue =
				(mockHumanEval[key as keyof TestHumanEvaluation] as number) - 1;
			(mockHumanEval[key as keyof TestHumanEvaluation] as number) =
				invalidValue;
			mockHumanEval.configId = `test-config-${++count}`;

			(mockHumanEval as Record<string, unknown>)[key] = null;
			try {
				await db
					.insert(humanEvaluations)
					.values(mockHumanEval as unknown as DrizzleNewHumanEvaluation);
				expect.fail("Should have thrown an error");
			} catch (error) {
				const constraintName = (error as DatabaseError).cause?.message;
				expect(constraintName).toContain("null value in column");
			}
		}
	});
	it("should not allow duplicate config_id + evaluation_set combination", async () => {
		const configId = "test-config-1";

		await db.insert(agentConfigs).values({
			id: configId,
			configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
		});

		await db.insert(humanEvaluations).values({
			configId,
			evaluationSet: 1,
			evaluatorId: "evaluator-123",
			recommendationQuality: 4,
			explanationClarity: 5,
			relevanceToProfile: 3,
			courseVariety: 4,
			trustworthiness: 5,
			overallSatisfaction: 4,
		});

		try {
			await db.insert(humanEvaluations).values({
				configId,
				evaluationSet: 1,
				evaluatorId: "evaluator-456",
				recommendationQuality: 3,
				explanationClarity: 4,
				relevanceToProfile: 2,
				courseVariety: 3,
				trustworthiness: 4,
				overallSatisfaction: 3,
			});
			expect.fail("Should have thrown an error");
		} catch (error) {
			expect(isPostgresError(error) && error.cause.constraint_name).toBe(
				"config_evaluation_set_must_be_unique",
			);
		}
	});

	it("should not allow same evaluator to evaluate same config multiple times", async () => {
		const configId = "test-config-1";

		await db.insert(agentConfigs).values({
			id: configId,
			configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
		});

		await db.insert(humanEvaluations).values({
			configId,
			evaluationSet: 1,
			evaluatorId: "evaluator-123",
			recommendationQuality: 4,
			explanationClarity: 5,
			relevanceToProfile: 3,
			courseVariety: 4,
			trustworthiness: 5,
			overallSatisfaction: 4,
		});

		try {
			await db.insert(humanEvaluations).values({
				configId,
				evaluationSet: 2,
				evaluatorId: "evaluator-123",
				recommendationQuality: 3,
				explanationClarity: 4,
				relevanceToProfile: 2,
				courseVariety: 3,
				trustworthiness: 4,
				overallSatisfaction: 3,
			});
			expect.fail("Should have thrown an error");
		} catch (error) {
			expect(isPostgresError(error) && error.cause.constraint_name).toBe(
				"config_evaluator_must_be_unique",
			);
		}
	});

	describe("updateConfig", () => {
		it("should successfully update an existing config", async () => {
			const configId = "test-config-1";
			const originalConfigDetails = JSON.stringify({
				model: "gpt-4",
				temperature: 0.7,
			});
			const updatedConfigDetails = JSON.stringify({
				model: "gpt-4",
				temperature: 0.9,
			});

			await db.insert(agentConfigs).values({
				id: configId,
				configDetails: originalConfigDetails,
			});

			const returnedId = await updateConfig(
				{
					id: configId,
					configDetails: updatedConfigDetails,
				},
				db,
			);

			expect(returnedId).toBe(configId);

			const configs = await db
				.select()
				.from(agentConfigs)
				.where(eq(agentConfigs.id, configId));
			expect(configs).toHaveLength(1);
			expect(configs[0].configDetails).toBe(updatedConfigDetails);
			expect(configs[0].updatedAt).not.toBe(configs[0].createdAt);
		});

		it("should throw an error when trying to update a non-existent config", async () => {
			const nonExistentId = "non-existent-config";

			await expect(async () => {
				await updateConfig(
					{
						id: nonExistentId,
						configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
					},
					db,
				);
			}).rejects.toThrow(`Config with ID ${nonExistentId} not found`);
		});
	});

	describe("upsertConfig", () => {
		it("should create a new config when no conflict exists", async () => {
			const configId = "test-config-1";
			const configDetails = JSON.stringify({
				model: "gpt-4",
				temperature: 0.7,
			});

			const returnedId = await upsertConfig(
				{
					id: configId,
					configDetails: configDetails,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				db,
			);

			expect(returnedId).toBe(configId);

			const configs = await db.select().from(agentConfigs);
			expect(configs).toHaveLength(1);
			expect(configs[0].id).toBe(configId);
			expect(configs[0].configDetails).toBe(configDetails);
		});

		it("should update configDetails when conflict exists", async () => {
			const configId = "test-config-1";
			const originalConfigDetails = JSON.stringify({
				model: "gpt-4",
				temperature: 0.7,
			});
			const updatedConfigDetails = JSON.stringify({
				model: "gpt-4",
				temperature: 0.9,
			});

			await db.insert(agentConfigs).values({
				id: configId,
				configDetails: originalConfigDetails,
			});

			const originalConfig = await db
				.select()
				.from(agentConfigs)
				.where(eq(agentConfigs.id, configId));
			const originalUpdatedAt = originalConfig[0].updatedAt;

			const returnedId = await upsertConfig(
				{
					id: configId,
					configDetails: updatedConfigDetails,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				db,
			);

			expect(returnedId).toBe(configId);

			const configs = await db.select().from(agentConfigs);
			expect(configs).toHaveLength(1);
			expect(configs[0].configDetails).toBe(updatedConfigDetails);
			expect(configs[0].updatedAt.getTime()).toBeGreaterThan(
				originalUpdatedAt.getTime(),
			);
		});

		it("should update updatedAt even when configDetails remains the same", async () => {
			const configId = "test-config-1";
			const configDetails = JSON.stringify({
				model: "gpt-4",
				temperature: 0.7,
			});

			await db.insert(agentConfigs).values({
				id: configId,
				configDetails: configDetails,
			});

			const originalConfig = await db
				.select()
				.from(agentConfigs)
				.where(eq(agentConfigs.id, configId));
			const originalUpdatedAt = originalConfig[0].updatedAt;

			await new Promise((resolve) => setTimeout(resolve, 10));

			const returnedId = await upsertConfig(
				{
					id: configId,
					configDetails: configDetails,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				db,
			);

			expect(returnedId).toBe(configId);

			const configs = await db.select().from(agentConfigs);
			expect(configs).toHaveLength(1);
			expect(configs[0].configDetails).toBe(configDetails);
			expect(configs[0].updatedAt.getTime()).toBeGreaterThan(
				originalUpdatedAt.getTime(),
			);
		});

		it("should handle multiple upserts correctly", async () => {
			const configId = "test-config-1";
			const configDetails1 = JSON.stringify({
				model: "gpt-4",
				temperature: 0.7,
			});
			const configDetails2 = JSON.stringify({
				model: "gpt-4",
				temperature: 0.8,
			});
			const configDetails3 = JSON.stringify({
				model: "gpt-4",
				temperature: 0.9,
			});

			await upsertConfig(
				{
					id: configId,
					configDetails: configDetails1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				db,
			);

			await upsertConfig(
				{
					id: configId,
					configDetails: configDetails2,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				db,
			);

			await upsertConfig(
				{
					id: configId,
					configDetails: configDetails3,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				db,
			);

			const configs = await db.select().from(agentConfigs);
			expect(configs).toHaveLength(1);
			expect(configs[0].configDetails).toBe(configDetails3);
		});
	});

	describe("getConfigWithEvaluations", () => {
		it("should return config with its evaluations", async () => {
			const configId = "test-config-1";

			await db.insert(agentConfigs).values({
				id: configId,
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
			});

			await db.insert(humanEvaluations).values([
				{
					configId,
					evaluationSet: 1,
					evaluatorId: "evaluator-123",
					recommendationQuality: 4,
					explanationClarity: 5,
					relevanceToProfile: 3,
					courseVariety: 4,
					trustworthiness: 5,
					overallSatisfaction: 4,
				},
				{
					configId,
					evaluationSet: 2,
					evaluatorId: "evaluator-456",
					recommendationQuality: 3,
					explanationClarity: 4,
					relevanceToProfile: 2,
					courseVariety: 3,
					trustworthiness: 4,
					overallSatisfaction: 3,
				},
			]);

			const result = await getConfigWithEvaluations(configId, db);

			expect(result).toEqual({
				id: "test-config-1",
				configDetails: '{"model":"gpt-4","temperature":0.7}',
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
				retrievalEvaluations: [],
				systemMetrics: [],
				generationEvaluations: [],
				humanEvaluations: [
					{
						id: expect.any(String),
						configId: "test-config-1",
						evaluationSet: 1,
						evaluatorId: "evaluator-123",
						recommendationQuality: 4,
						explanationClarity: 5,
						relevanceToProfile: 3,
						courseVariety: 4,
						trustworthiness: 5,
						overallSatisfaction: 4,
						evaluatedAt: expect.any(Date),
						createdAt: expect.any(Date),
					},
					{
						id: expect.any(String),
						configId: "test-config-1",
						evaluationSet: 2,
						evaluatorId: "evaluator-456",
						recommendationQuality: 3,
						explanationClarity: 4,
						relevanceToProfile: 2,
						courseVariety: 3,
						trustworthiness: 4,
						overallSatisfaction: 3,
						evaluatedAt: expect.any(Date),
						createdAt: expect.any(Date),
					},
				],
			});
		});
	});
	describe("setConfig", () => {
		it("should insert config and return its id", async () => {
			const configData = {
				id: "test-config-1",
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const returnedId = await setConfig(configData, db);

			expect(returnedId).toBe("test-config-1");

			const configs = await db.select().from(agentConfigs);
			expect(configs).toHaveLength(1);
			expect(configs[0]).toEqual({
				id: "test-config-1",
				configDetails: '{"model":"gpt-4","temperature":0.7}',
				createdAt: expect.any(Date),
				updatedAt: expect.any(Date),
			});
		});
	});
	describe("setHumanEval", () => {
		it("should increment evaluationSet based on existing evaluations for the config", async () => {
			const configId = "test-config-1";

			await db.insert(agentConfigs).values({
				id: configId,
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
			});

			const firstEvalId = await setHumanEval(
				{
					configId,
					evaluatorId: "evaluator-123",
					recommendationQuality: 4,
					explanationClarity: 5,
					relevanceToProfile: 3,
					courseVariety: 4,
					trustworthiness: 5,
					overallSatisfaction: 4,
				},
				db,
			);

			const secondEvalId = await setHumanEval(
				{
					configId,
					evaluatorId: "evaluator-456",
					recommendationQuality: 3,
					explanationClarity: 4,
					relevanceToProfile: 2,
					courseVariety: 3,
					trustworthiness: 4,
					overallSatisfaction: 3,
				},
				db,
			);

			const evaluations = await db.select().from(humanEvaluations);
			expect(evaluations).toHaveLength(2);

			const firstEval = evaluations.find((e) => e.id === firstEvalId);
			const secondEval = evaluations.find((e) => e.id === secondEvalId);

			expect(firstEval?.evaluationSet).toBe(1);
			expect(secondEval?.evaluationSet).toBe(2);
		});
	});
	describe("upsertAutoEvaluation", () => {
		it("should create a new auto evaluation when no conflict exists", async () => {
			const configId = "test-config-1";
			const chatId = "test-chat-1";

			await db.insert(agentConfigs).values({
				id: configId,
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
			});

			const autoEvaluationData = {
				agentConfigId: configId,
				chatId: chatId,
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
				totalLlmTokens: 1500,
				totalLlmTime: 2,
				llmCalls: 3,
				ragSearchCalls: 2,
				totalRagTime: 1,
				hasError: false,
				hasTimeout: false,
				totalRunTime: 3,
			};

			const result = await upsertRetrievalEvaluation(autoEvaluationData, db);

			expect(result).toEqual({
				agentConfigId: configId,
				chatId: chatId,
			});

			const evaluations = await db.select().from(retrievalEvaluations);
			expect(evaluations).toHaveLength(1);
			expect(evaluations[0].agentConfigId).toBe(configId);
			expect(evaluations[0].chatId).toBe(chatId);
			expect(evaluations[0].contextPrecision).toBe(0.85);
			expect(evaluations[0].faithfulness).toBe(0.92);
		});

		it("should update existing auto evaluation when conflict exists", async () => {
			const configId = "test-config-1";
			const chatId = "test-chat-1";

			await db.insert(agentConfigs).values({
				id: configId,
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
			});

			const originalEvaluationData = {
				agentConfigId: configId,
				chatId: chatId,
				contextPrecision: 0.7,
				contextRecall: 0.75,
				contextF1: 0.72,
				mrr: 0.6,
				ndcg: 0.65,
				answerSimilarity: 0.7,
				faithfulness: 0.8,
				answerRelevancy: 0.75,
				answerCorrectness: 0.78,
				hitRate: 0.85,
				averagePrecision: 0.7,
				totalLlmTokens: 1000,
				totalLlmTime: 2.0,
				llmCalls: 2,
				ragSearchCalls: 1,
				totalRagTime: 1.0,
				hasError: false,
				hasTimeout: false,
				totalRunTime: 3.0,
			};

			await db.insert(retrievalEvaluations).values(originalEvaluationData);

			const originalEvaluation = await db.select().from(retrievalEvaluations);
			const originalUpdatedAt = originalEvaluation[0].updatedAt;

			await new Promise((resolve) => setTimeout(resolve, 10));

			const updatedEvaluationData = {
				agentConfigId: configId,
				chatId: chatId,
				contextPrecision: 0.95,
				contextRecall: 0.98,
				contextF1: 0.96,
				mrr: 0.88,
				ndcg: 0.92,
				answerSimilarity: 0.94,
				faithfulness: 0.97,
				answerRelevancy: 0.93,
				answerCorrectness: 0.95,
				hitRate: 0.99,
				averagePrecision: 0.91,
			};

			const result = await upsertRetrievalEvaluation(updatedEvaluationData, db);

			expect(result).toEqual({
				agentConfigId: configId,
				chatId: chatId,
			});

			const evaluations = await db.select().from(retrievalEvaluations);
			expect(evaluations).toHaveLength(1);
			expect(evaluations[0].contextPrecision).toBe(0.95);
			expect(evaluations[0].faithfulness).toBe(0.97);

			expect(evaluations[0].updatedAt.getTime()).toBeGreaterThan(
				originalUpdatedAt.getTime(),
			);
		});
	});

	describe("upsertSystemEvaluations", () => {
		it("should create a new system evaluation when no conflict exists", async () => {
			const configId = "test-config-1";
			const chatId = "test-chat-1";

			await db.insert(agentConfigs).values({
				id: configId,
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
			});

			const systemEvaluationData = {
				agentConfigId: configId,
				chatId: chatId,
				totalLlmTokens: 1500,
				totalLlmTime: 2,
				llmCalls: 3,
				ragSearchCalls: 2,
				totalRagTime: 1,
				hasError: false,
				hasTimeout: false,
				totalRunTime: 3,
			};

			const result = await upsertSystemEvaluations(systemEvaluationData, db);

			expect(result).toEqual({
				agentConfigId: configId,
				chatId: chatId,
			});

			const evaluations = await db.select().from(systemEvaluations);
			expect(evaluations).toHaveLength(1);
			expect(evaluations[0].agentConfigId).toBe(configId);
			expect(evaluations[0].chatId).toBe(chatId);
			expect(evaluations[0].totalLlmTokens).toBe(1500);
			expect(evaluations[0].totalLlmTime).toBe(2);
			expect(evaluations[0].llmCalls).toBe(3);
			expect(evaluations[0].ragSearchCalls).toBe(2);
			expect(evaluations[0].totalRagTime).toBe(1);
			expect(evaluations[0].hasError).toBe(false);
			expect(evaluations[0].hasTimeout).toBe(false);
			expect(evaluations[0].totalRunTime).toBe(3);
		});

		it("should update existing system evaluation when conflict exists", async () => {
			const configId = "test-config-1";
			const chatId = "test-chat-1";

			await db.insert(agentConfigs).values({
				id: configId,
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
			});

			const originalEvaluationData = {
				agentConfigId: configId,
				chatId: chatId,
				totalLlmTokens: 1000,
				totalLlmTime: 2,
				llmCalls: 2,
				ragSearchCalls: 1,
				totalRagTime: 1,
				hasError: false,
				hasTimeout: false,
				totalRunTime: 3,
			};

			await db.insert(systemEvaluations).values(originalEvaluationData);

			const originalEvaluation = await db.select().from(systemEvaluations);
			const originalUpdatedAt = originalEvaluation[0].updatedAt;

			await new Promise((resolve) => setTimeout(resolve, 10));

			const updatedEvaluationData = {
				agentConfigId: configId,
				chatId: chatId,
				totalLlmTokens: 2000,
				totalLlmTime: 3,
				llmCalls: 5,
				ragSearchCalls: 3,
				totalRagTime: 2,
				hasError: true,
				hasTimeout: false,
				totalRunTime: 5,
			};

			const result = await upsertSystemEvaluations(updatedEvaluationData, db);

			expect(result).toEqual({
				agentConfigId: configId,
				chatId: chatId,
			});

			const evaluations = await db.select().from(systemEvaluations);
			expect(evaluations).toHaveLength(1);
			expect(evaluations[0].totalLlmTokens).toBe(2000);
			expect(evaluations[0].totalLlmTime).toBe(3);
			expect(evaluations[0].llmCalls).toBe(5);
			expect(evaluations[0].hasError).toBe(true);
			expect(evaluations[0].totalRunTime).toBe(5);

			expect(evaluations[0].updatedAt.getTime()).toBeGreaterThan(
				originalUpdatedAt.getTime(),
			);
		});
	});

	describe("upsertGenerationEvaluations", () => {
		it("should create a new generation evaluation when no conflict exists", async () => {
			const configId = "test-config-1";
			const chatId = "test-chat-1";

			await db.insert(agentConfigs).values({
				id: configId,
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
			});

			const generationEvaluationData = {
				agentConfigId: configId,
				chatId: chatId,
				llmAsJudge: true,
				generatedAnswerSimilarity: 0.9,
			};

			const result = await upsertGenerationEvaluations(
				generationEvaluationData,
				db,
			);

			expect(result).toEqual({
				agentConfigId: configId,
				chatId: chatId,
			});

			const evaluations = await db.select().from(generationEvaluations);
			expect(evaluations).toHaveLength(1);
			expect(evaluations[0].agentConfigId).toBe(configId);
			expect(evaluations[0].chatId).toBe(chatId);
			expect(evaluations[0].llmAsJudge).toBe(true);
			expect(evaluations[0].generatedAnswerSimilarity).toBe(0.9);
		});

		it("should update existing generation evaluation when conflict exists", async () => {
			const configId = "test-config-1";
			const chatId = "test-chat-1";

			await db.insert(agentConfigs).values({
				id: configId,
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
			});

			const originalEvaluationData = {
				agentConfigId: configId,
				chatId: chatId,
				llmAsJudge: false,
				generatedAnswerSimilarity: 0.8,
			};

			await db.insert(generationEvaluations).values(originalEvaluationData);

			const originalEvaluation = await db.select().from(generationEvaluations);
			const originalUpdatedAt = originalEvaluation[0].updatedAt;

			await new Promise((resolve) => setTimeout(resolve, 10));

			const updatedEvaluationData = {
				agentConfigId: configId,
				chatId: chatId,
				llmAsJudge: true,
				generatedAnswerSimilarity: 0.9,
			};

			const result = await upsertGenerationEvaluations(
				updatedEvaluationData,
				db,
			);

			expect(result).toEqual({
				agentConfigId: configId,
				chatId: chatId,
			});

			const evaluations = await db.select().from(generationEvaluations);
			expect(evaluations).toHaveLength(1);
			expect(evaluations[0].llmAsJudge).toBe(true);
			expect(evaluations[0].generatedAnswerSimilarity).toBe(0.9);
			expect(evaluations[0].updatedAt.getTime()).toBeGreaterThan(
				originalUpdatedAt.getTime(),
			);
		});
	});
});
