import { relations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	pgSchema,
	primaryKey,
	real,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

const evalSchema = pgSchema("eval");
const authSchema = pgSchema("auth");

export const users = authSchema.table("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	name: varchar("name", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agentConfigs = evalSchema.table("agent_configs", {
	id: varchar("id", { length: 255 }).primaryKey(),
	configDetails: text("config_details"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const systemEvaluations = evalSchema.table(
	"system_evaluations",
	{
		agentConfigId: varchar("agent_config_id", { length: 255 })
			.notNull()
			.references(() => agentConfigs.id, { onDelete: "cascade" }),
		chatId: varchar("chat_id", { length: 255 }).notNull(),

		totalLlmTokens: integer("total_llm_tokens").notNull(),
		totalLlmTime: integer("total_llm_time").notNull(),
		llmCalls: integer("llm_calls").notNull(),
		ragSearchCalls: integer("rag_search_calls").notNull(),
		totalRagTime: integer("total_rag_time").notNull(),
		totalRunTime: integer("total_run_time").notNull(),

		hasError: boolean("has_error").notNull().default(false),
		hasTimeout: boolean("has_timeout").notNull().default(false),

		evaluatedAt: timestamp("evaluated_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.agentConfigId, table.chatId] }),
		index("system_metrics_chat_id_idx").on(table.chatId),
	],
);

export const retrievalEvaluations = evalSchema.table(
	"retrieval_evaluations",
	{
		agentConfigId: varchar("agent_config_id", { length: 255 })
			.notNull()
			.references(() => agentConfigs.id, { onDelete: "cascade" }),
		chatId: varchar("chat_id", { length: 255 }).notNull(),

		contextPrecision: real("context_precision").notNull(),
		contextRecall: real("context_recall").notNull(),
		contextF1: real("context_f1").notNull(),
		mrr: real("mrr").notNull(),
		ndcg: real("ndcg").notNull(),
		hitRate: real("hit_rate").notNull(),
		averagePrecision: real("average_precision").notNull(),

		answerSimilarity: real("answer_similarity").notNull(),
		faithfulness: real("faithfulness").notNull(),
		answerRelevancy: real("answer_relevancy").notNull(),
		answerCorrectness: real("answer_correctness").notNull(),

		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.agentConfigId, table.chatId] }),
		index("retrieval_evaluations_chat_id_idx").on(table.chatId),
	],
);

export const generationEvaluations = evalSchema.table(
	"generation_evaluations",
	{
		agentConfigId: varchar("agent_config_id", { length: 255 })
			.notNull()
			.references(() => agentConfigs.id, { onDelete: "cascade" }),
		chatId: varchar("chat_id", { length: 255 }).notNull(),
		llmAsJudge: boolean("llm_as_judge").notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		generatedAnswerSimilarity: real("generated_answer_similarity").notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.agentConfigId, table.chatId] }),
		index("generation_evaluations_chat_id_idx").on(table.chatId),
	],
);

export const humanEvaluations = evalSchema.table(
	"human_evaluations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		configId: varchar("config_id", { length: 255 })
			.references(() => agentConfigs.id)
			.notNull(),
		evaluationSet: integer("evaluation_set").notNull(),
		evaluatorId: varchar("evaluator_id", { length: 100 }).notNull(),
		recommendationQuality: integer("recommendation_quality").notNull(),
		explanationClarity: integer("explanation_clarity").notNull(),
		relevanceToProfile: integer("relevance_to_profile").notNull(),
		courseVariety: integer("course_variety").notNull(),
		trustworthiness: integer("trustworthiness").notNull(),
		overallSatisfaction: integer("overall_satisfaction").notNull(),
		evaluatedAt: timestamp("evaluated_at").defaultNow().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		check("evaluation_set_must_be_1_or_2", sql`evaluation_set IN (1, 2)`),
		check(
			"recommendation_quality_must_be_1_to_5",
			sql`recommendation_quality >= 1 AND recommendation_quality <= 5`,
		),
		check(
			"explanation_clarity_must_be_1_to_5",
			sql`explanation_clarity >= 1 AND explanation_clarity <= 5`,
		),
		check(
			"relevance_to_profile_must_be_1_to_5",
			sql`relevance_to_profile >= 1 AND relevance_to_profile <= 5`,
		),
		check(
			"course_variety_must_be_1_to_5",
			sql`course_variety >= 1 AND course_variety <= 5`,
		),
		check(
			"trustworthiness_must_be_1_to_5",
			sql`trustworthiness >= 1 AND trustworthiness <= 5`,
		),
		check(
			"overall_satisfaction_must_be_1_to_5",
			sql`overall_satisfaction >= 1 AND overall_satisfaction <= 5`,
		),
		unique("config_evaluation_set_must_be_unique").on(
			table.configId,
			table.evaluationSet,
		),
		unique("config_evaluator_must_be_unique").on(
			table.configId,
			table.evaluatorId,
		),
		index("human_evaluations_config_idx").on(table.configId),
		index("human_evaluations_config_set_idx").on(
			table.configId,
			table.evaluationSet,
		),
	],
);

export const agentConfigsRelations = relations(agentConfigs, ({ many }) => ({
	humanEvaluations: many(humanEvaluations),
	systemMetrics: many(systemEvaluations),
	retrievalEvaluations: many(retrievalEvaluations),
	generationEvaluations: many(generationEvaluations),
}));

export const systemEvaluationsRelations = relations(
	systemEvaluations,
	({ one }) => ({
		agentConfig: one(agentConfigs, {
			fields: [systemEvaluations.agentConfigId],
			references: [agentConfigs.id],
		}),
	}),
);

export const retrievalEvaluationsRelations = relations(
	retrievalEvaluations,
	({ one }) => ({
		agentConfig: one(agentConfigs, {
			fields: [retrievalEvaluations.agentConfigId],
			references: [agentConfigs.id],
		}),
	}),
);

export const generationEvaluationsRelations = relations(
	generationEvaluations,
	({ one }) => ({
		agentConfig: one(agentConfigs, {
			fields: [generationEvaluations.agentConfigId],
			references: [agentConfigs.id],
		}),
	}),
);

export const humanEvaluationsRelations = relations(
	humanEvaluations,
	({ one }) => ({
		config: one(agentConfigs, {
			fields: [humanEvaluations.configId],
			references: [agentConfigs.id],
		}),
	}),
);

export const schema = {
	agentConfigs,
	humanEvaluations,
	systemMetrics: systemEvaluations,
	agentConfigsRelations,
	humanEvaluationsRelations,
	retrievalEvaluations,
	retrievalEvaluationsRelations,
	generationEvaluations,
	generationEvaluationsRelations,
	systemMetricsRelations: systemEvaluationsRelations,
	users,
};
