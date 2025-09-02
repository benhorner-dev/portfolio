/* v8 ignore start */
import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
	authorizationParameters: { scope: process.env.AUTH0_SCOPE },
});

export async function getAuth0UserId(): Promise<string | undefined> {
	const session = await auth0.getSession();

	return session?.user?.sub;
}

/* v8 ignore stop */
