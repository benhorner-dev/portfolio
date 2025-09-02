ALTER TABLE "auth"."users" ADD COLUMN "tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD COLUMN "auth_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id");