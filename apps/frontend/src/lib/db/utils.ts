"use server";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { neon } from "@neondatabase/serverless";

import { drizzle as serverLessDrizzle } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { Environment } from "@/lib/constants";
import { DbClientError, DbOpError } from "./errors";
import { schema } from "./schema";
import type { Database, ServerLessDatabase } from "./types";

let devDb: Database | null = null;
let devSql: postgres.Sql | null = null;
let prodDb: ServerLessDatabase | null = null;
let prodSql: NeonQueryFunction<false, false> | null = null;
type DbOperation<T extends unknown[], R> = (...args: T) => Promise<R>;

export async function getDb(
	uri: string,
	env: Environment.DEVELOPMENT,
): Promise<{
	db: Database;
	close: () => Promise<void>;
}>;
export async function getDb(
	uri: string,
	env: Environment.PRODUCTION,
): Promise<{
	db: ServerLessDatabase;
	close: () => Promise<void>;
}>;
export async function getDb(
	uri: string,
	env?: Environment.DEVELOPMENT,
): Promise<{
	db: Database;
	close: () => Promise<void>;
}>;

export async function getDb(
	uri: string,
	env: Environment = Environment.DEVELOPMENT,
): Promise<{
	db: Database | ServerLessDatabase;
	close: () => Promise<void>;
}> {
	try {
		if (env === Environment.PRODUCTION) {
			if (!prodDb) {
				prodSql = neon(uri);
				prodDb = serverLessDrizzle(prodSql, { schema });
			}
			return {
				db: prodDb,
				close: async () => {
					prodSql = null;
					prodDb = null;
				},
			};
		}
		if (!devDb) {
			devSql = postgres(uri, {
				max: 1,
				idle_timeout: 20,
				max_lifetime: 60 * 30, // 30 minutes
			});
			devDb = drizzle(devSql, { schema });
		}
		return {
			db: devDb,
			close: async () => {
				if (devSql) {
					await devSql.end();
					devSql = null;
					devDb = null;
				}
			},
		};
	} catch (error) {
		throw new DbClientError(`Failed to connect to database: ${error}`);
	}
}
export const dbOperation = async <T extends unknown[], R>(
	operation: DbOperation<T, R>,
) => {
	return async (...args: T): Promise<R> => {
		try {
			return await operation(...args);
		} catch (error) {
			const name = operation.name || "Unknown operation";

			throw new DbOpError(
				`Failed to ${name}: ${(error as unknown as Error)?.cause ? ` ${(error as unknown as Error)?.cause}` : ""} \n\n ${error}`,
			);
		}
	};
};
