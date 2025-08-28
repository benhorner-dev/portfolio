import { sql } from "drizzle-orm";
import {
	generationEvaluations,
	retrievalEvaluations,
	systemEvaluations,
} from "@/lib/db/schema";
import type {
	Database,
	NewGenerationEvaluation,
	NewRetrievalEvaluation,
	NewSystemEvaluations,
	ServerLessDatabase,
} from "@/lib/db/types";

import { dbOperation } from "@/lib/db/utils";

export const upsertRetrievalEvaluation = await dbOperation(
	async (
		evaluation: NewRetrievalEvaluation,
		db: Database | ServerLessDatabase,
	): Promise<{ agentConfigId: string; chatId: string }> => {
		await db
			.insert(retrievalEvaluations)
			.values(evaluation)
			.onConflictDoUpdate({
				target: [
					retrievalEvaluations.agentConfigId,
					retrievalEvaluations.chatId,
				],
				set: {
					contextPrecision: sql`excluded.context_precision`,
					contextRecall: sql`excluded.context_recall`,
					contextF1: sql`excluded.context_f1`,
					mrr: sql`excluded.mrr`,
					ndcg: sql`excluded.ndcg`,
					answerSimilarity: sql`excluded.answer_similarity`,
					faithfulness: sql`excluded.faithfulness`,
					answerRelevancy: sql`excluded.answer_relevancy`,
					answerCorrectness: sql`excluded.answer_correctness`,
					hitRate: sql`excluded.hit_rate`,
					averagePrecision: sql`excluded.average_precision`,
					updatedAt: sql`now()`,
				},
			});

		return {
			agentConfigId: evaluation.agentConfigId,
			chatId: evaluation.chatId,
		};
	},
);

export const upsertSystemEvaluations = await dbOperation(
	async (
		evaluation: NewSystemEvaluations,
		db: Database | ServerLessDatabase,
	): Promise<{ agentConfigId: string; chatId: string }> => {
		await db
			.insert(systemEvaluations)
			.values(evaluation)
			.onConflictDoUpdate({
				target: [systemEvaluations.agentConfigId, systemEvaluations.chatId],
				set: {
					totalLlmTokens: sql`excluded.total_llm_tokens`,
					totalLlmTime: sql`excluded.total_llm_time`,
					llmCalls: sql`excluded.llm_calls`,
					ragSearchCalls: sql`excluded.rag_search_calls`,
					totalRagTime: sql`excluded.total_rag_time`,
					hasError: sql`excluded.has_error`,
					hasTimeout: sql`excluded.has_timeout`,
					totalRunTime: sql`excluded.total_run_time`,
					updatedAt: sql`now()`,
				},
			});

		return {
			agentConfigId: evaluation.agentConfigId,
			chatId: evaluation.chatId,
		};
	},
);

export const upsertGenerationEvaluations = await dbOperation(
	async (
		evaluation: NewGenerationEvaluation,
		db: Database | ServerLessDatabase,
	): Promise<{ agentConfigId: string; chatId: string }> => {
		await db
			.insert(generationEvaluations)
			.values(evaluation)
			.onConflictDoUpdate({
				target: [
					generationEvaluations.agentConfigId,
					generationEvaluations.chatId,
				],
				set: {
					llmAsJudge: sql`excluded.llm_as_judge`,
					generatedAnswerSimilarity: sql`excluded.generated_answer_similarity`,
					updatedAt: sql`now()`,
				},
			});
		return {
			agentConfigId: evaluation.agentConfigId,
			chatId: evaluation.chatId,
		};
	},
);
