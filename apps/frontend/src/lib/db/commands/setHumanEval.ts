"use server";

import { count, eq } from "drizzle-orm";
import { humanEvaluations } from "@/lib/db/schema";
import type {
	Database,
	DrizzleHumanEvaluationUpdateAll,
	ServerLessDatabase,
} from "@/lib/db/types";
import { dbOperation } from "@/lib/db/utils";

export const setHumanEval = await dbOperation(
	async (
		evaluation: DrizzleHumanEvaluationUpdateAll,
		db: Database | ServerLessDatabase,
	): Promise<string> => {
		return await db.transaction(async (tx) => {
			const [countResult] = await tx
				.select({ count: count() })
				.from(humanEvaluations)
				.where(eq(humanEvaluations.configId, evaluation.configId));

			const [persistedEval] = await tx
				.insert(humanEvaluations)
				.values({
					...evaluation,
					evaluationSet: countResult.count + 1,
				})
				.returning();

			return persistedEval.id;
		});
	},
);
