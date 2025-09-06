import { sql } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import type {
	Database,
	NewUser,
	ServerLessDatabase,
	User,
} from "@/lib/db/types";

import { dbOperation } from "@/lib/db/utils";

export const upsertUser = await dbOperation(
	async (user: NewUser, db: Database | ServerLessDatabase): Promise<User> => {
		const [result] = await db
			.insert(users)
			.values(user)
			.onConflictDoUpdate({
				target: [users.authId],
				set: {
					email: sql`excluded.email`,
					name: sql`excluded.name`,
					tokens:
						user.tokens !== undefined
							? sql`excluded.tokens`
							: sql`users.tokens`,
					updatedAt: sql`now()`,
				},
			})
			.returning();

		return result;
	},
);
