CREATE SCHEMA IF NOT EXISTS "eval";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "auth";
--> statement-breakpoint
CREATE TABLE "eval"."agent_configs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"config_details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval"."generation_evaluations" (
	"agent_config_id" varchar(255) NOT NULL,
	"chat_id" varchar(255) NOT NULL,
	"llm_as_judge" boolean NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"generated_answer_similarity" real NOT NULL,
	CONSTRAINT "generation_evaluations_agent_config_id_chat_id_pk" PRIMARY KEY("agent_config_id","chat_id")
);
--> statement-breakpoint
CREATE TABLE "eval"."human_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" varchar(255) NOT NULL,
	"evaluation_set" integer NOT NULL,
	"evaluator_id" varchar(100) NOT NULL,
	"recommendation_quality" integer NOT NULL,
	"explanation_clarity" integer NOT NULL,
	"relevance_to_profile" integer NOT NULL,
	"course_variety" integer NOT NULL,
	"trustworthiness" integer NOT NULL,
	"overall_satisfaction" integer NOT NULL,
	"evaluated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "config_evaluation_set_must_be_unique" UNIQUE("config_id","evaluation_set"),
	CONSTRAINT "config_evaluator_must_be_unique" UNIQUE("config_id","evaluator_id"),
	CONSTRAINT "evaluation_set_must_be_1_or_2" CHECK (evaluation_set IN (1, 2)),
	CONSTRAINT "recommendation_quality_must_be_1_to_5" CHECK (recommendation_quality >= 1 AND recommendation_quality <= 5),
	CONSTRAINT "explanation_clarity_must_be_1_to_5" CHECK (explanation_clarity >= 1 AND explanation_clarity <= 5),
	CONSTRAINT "relevance_to_profile_must_be_1_to_5" CHECK (relevance_to_profile >= 1 AND relevance_to_profile <= 5),
	CONSTRAINT "course_variety_must_be_1_to_5" CHECK (course_variety >= 1 AND course_variety <= 5),
	CONSTRAINT "trustworthiness_must_be_1_to_5" CHECK (trustworthiness >= 1 AND trustworthiness <= 5),
	CONSTRAINT "overall_satisfaction_must_be_1_to_5" CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5)
);
--> statement-breakpoint
CREATE TABLE "eval"."retrieval_evaluations" (
	"agent_config_id" varchar(255) NOT NULL,
	"chat_id" varchar(255) NOT NULL,
	"context_precision" real NOT NULL,
	"context_recall" real NOT NULL,
	"context_f1" real NOT NULL,
	"mrr" real NOT NULL,
	"ndcg" real NOT NULL,
	"hit_rate" real NOT NULL,
	"average_precision" real NOT NULL,
	"answer_similarity" real NOT NULL,
	"faithfulness" real NOT NULL,
	"answer_relevancy" real NOT NULL,
	"answer_correctness" real NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "retrieval_evaluations_agent_config_id_chat_id_pk" PRIMARY KEY("agent_config_id","chat_id")
);
--> statement-breakpoint
CREATE TABLE "eval"."system_evaluations" (
	"agent_config_id" varchar(255) NOT NULL,
	"chat_id" varchar(255) NOT NULL,
	"total_llm_tokens" integer NOT NULL,
	"total_llm_time" integer NOT NULL,
	"llm_calls" integer NOT NULL,
	"rag_search_calls" integer NOT NULL,
	"total_rag_time" integer NOT NULL,
	"total_run_time" integer NOT NULL,
	"has_error" boolean DEFAULT false NOT NULL,
	"has_timeout" boolean DEFAULT false NOT NULL,
	"evaluated_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_evaluations_agent_config_id_chat_id_pk" PRIMARY KEY("agent_config_id","chat_id")
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "eval"."generation_evaluations" ADD CONSTRAINT "generation_evaluations_agent_config_id_agent_configs_id_fk" FOREIGN KEY ("agent_config_id") REFERENCES "eval"."agent_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval"."human_evaluations" ADD CONSTRAINT "human_evaluations_config_id_agent_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "eval"."agent_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval"."retrieval_evaluations" ADD CONSTRAINT "retrieval_evaluations_agent_config_id_agent_configs_id_fk" FOREIGN KEY ("agent_config_id") REFERENCES "eval"."agent_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval"."system_evaluations" ADD CONSTRAINT "system_evaluations_agent_config_id_agent_configs_id_fk" FOREIGN KEY ("agent_config_id") REFERENCES "eval"."agent_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "generation_evaluations_chat_id_idx" ON "eval"."generation_evaluations" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "human_evaluations_config_idx" ON "eval"."human_evaluations" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "human_evaluations_config_set_idx" ON "eval"."human_evaluations" USING btree ("config_id","evaluation_set");--> statement-breakpoint
CREATE INDEX "retrieval_evaluations_chat_id_idx" ON "eval"."retrieval_evaluations" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "system_metrics_chat_id_idx" ON "eval"."system_evaluations" USING btree ("chat_id");
