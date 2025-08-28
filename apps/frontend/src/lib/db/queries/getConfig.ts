"use server";
import { eq } from "drizzle-orm";
import { agentConfigs } from "@/lib/db/schema";
import type { Database, ServerLessDatabase } from "@/lib/db/types";
import { dbOperation } from "@/lib/db/utils";

const _configQueryResult = async (
	configId: string,
	db: Database | ServerLessDatabase,
) => {
	const config = await db.query.agentConfigs.findFirst({
		where: eq(agentConfigs.id, configId),
		with: {
			humanEvaluations: true,
			retrievalEvaluations: true,
			generationEvaluations: true,
			systemMetrics: true,
		},
	});

	return config;
};

export const getConfigWithEvaluations = await dbOperation(_configQueryResult);

export type AgentConfigWithEvaluations = Awaited<
	ReturnType<typeof _configQueryResult>
>;
