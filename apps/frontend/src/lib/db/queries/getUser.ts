"use server";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import type { Database, ServerLessDatabase } from "@/lib/db/types";
import { dbOperation } from "@/lib/db/utils";

const _userQueryResult = async (
	authId: string,
	db: Database | ServerLessDatabase,
) => {
	const user = await db.query.users.findFirst({
		where: eq(users.authId, authId),
	});

	return user;
};

export const getUserByAuthId = await dbOperation(_userQueryResult);

export type UserByAuthId = Awaited<ReturnType<typeof _userQueryResult>>;
