import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { upsertUser } from "@/lib/db/commands/upsertUser";
import { getDb } from "@/lib/db/utils";
import { getLogger } from "@/lib/logger";
import { SessionSchema } from "@/lib/schema";

const logger = getLogger("auth0");
/* v8 ignore start */
export const auth0 = new Auth0Client({
	authorizationParameters: { scope: process.env.AUTH0_SCOPE },
});
/* v8 ignore stop */

export async function getAuth0UserId(): Promise<string | undefined> {
	const session = await auth0.getSession();
	if (!session) {
		return undefined;
	}
	const parsedSession = SessionSchema.safeParse(session);
	if (!parsedSession.success) {
		logger.error("Invalid session", parsedSession.error);
		return undefined;
	}
	const uri = process.env.DATABASE_URL;
	if (!uri) {
		logger.error("DATABASE_URL is not set");
		return undefined;
	}
	const { db, close } = await getDb(uri);
	try {
		await upsertUser(parsedSession.data.user, db);
	} catch (error) {
		logger.error("Failed to upsert user", error);
		return undefined;
	} finally {
		await close();
	}
	return parsedSession.data.user.authId;
}
