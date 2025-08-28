import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type {
	agentConfigs,
	generationEvaluations,
	humanEvaluations,
	retrievalEvaluations,
	schema,
	systemEvaluations,
} from "./schema";

export type AgentConfig = InferSelectModel<typeof agentConfigs>;
export type NewAgentConfig = InferInsertModel<typeof agentConfigs>;
export type RetrievalEvaluation = InferSelectModel<typeof retrievalEvaluations>;
export type NewRetrievalEvaluation = InferInsertModel<
	typeof retrievalEvaluations
>;
export type GenerationEvaluation = InferSelectModel<
	typeof generationEvaluations
>;
export type NewGenerationEvaluation = InferInsertModel<
	typeof generationEvaluations
>;
export type SystemEvaluations = InferSelectModel<typeof systemEvaluations>;
export type NewSystemEvaluations = InferInsertModel<typeof systemEvaluations>;
export type DrizzleHumanEvaluation = InferSelectModel<typeof humanEvaluations>;
export type DrizzleNewHumanEvaluation = InferInsertModel<
	typeof humanEvaluations
>;
export type DrizzleAgentConfig = InferSelectModel<typeof agentConfigs>;

export type Database = PostgresJsDatabase<typeof schema>;
export type ServerLessDatabase = NeonHttpDatabase<typeof schema>;

export type DrizzleHumanEvaluationUpdateAll = Omit<
	DrizzleNewHumanEvaluation,
	"id" | "evaluationSet" | "evaluatedAt" | "createdAt"
>;
export type DrizzleHumanEvaluationUpdateMetrics = Omit<
	DrizzleHumanEvaluationUpdateAll,
	"configId" | "evaluatorId"
>;
export type DrizzleAgentConfigUpdate = Omit<
	Partial<DrizzleAgentConfig>,
	"createdAt" | "updatedAt"
> & {
	id: string;
};

export type MetricUnionType = (
	| NewRetrievalEvaluation
	| NewGenerationEvaluation
) &
	Partial<NewSystemEvaluations>;

export interface DatabaseError extends Error {
	cause?: {
		constraint_name?: string;
		message?: string;
		code?: string;
	};
}

export interface PostgresError extends DatabaseError {
	cause: {
		constraint_name: string;
		message: string;
		code: string;
	};
}

export type TestHumanEvaluation = {
	configId: string;
	evaluationSet: number;
	evaluatorId: string;
	recommendationQuality: number;
	explanationClarity: number;
	relevanceToProfile: number;
	courseVariety: number;
	trustworthiness: number;
	overallSatisfaction: number;
};
