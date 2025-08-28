"use server";

import { eq, sql } from "drizzle-orm";
import { agentConfigs } from "@/lib/db/schema";
import type {
	Database,
	DrizzleAgentConfig,
	DrizzleAgentConfigUpdate,
	ServerLessDatabase,
} from "@/lib/db/types";
import { dbOperation } from "@/lib/db/utils";

export const setConfig = await dbOperation(
	async (
		config: DrizzleAgentConfig,
		db: Database | ServerLessDatabase,
	): Promise<string> => {
		await db.insert(agentConfigs).values(config);
		return config.id;
	},
);

export const updateConfig = await dbOperation(
	async (
		updates: DrizzleAgentConfigUpdate,
		db: Database | ServerLessDatabase,
	): Promise<string> => {
		const [updatedConfig] = await db
			.update(agentConfigs)
			.set({
				...updates,
				updatedAt: new Date(),
			})
			.where(eq(agentConfigs.id, updates.id))
			.returning();

		if (!updatedConfig) {
			throw new Error(`Config with ID ${updates.id} not found`);
		}

		return updatedConfig.id;
	},
);

export const upsertConfig = await dbOperation(
	async (
		config: DrizzleAgentConfig,
		db: Database | ServerLessDatabase,
	): Promise<string> => {
		await db
			.insert(agentConfigs)
			.values({
				id: config.id,
				configDetails: config.configDetails,
			})
			.onConflictDoUpdate({
				target: agentConfigs.id,
				set: {
					configDetails: sql`excluded.config_details`,
					updatedAt: sql`now()`,
				},
			});
		return config.id;
	},
);
