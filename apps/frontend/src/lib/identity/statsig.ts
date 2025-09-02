import type { StatsigUser } from "@flags-sdk/statsig";
import type { Identify } from "flags";
import { dedupe } from "flags/next";

export const identifyStatsig = (
	userIdGetter: () => Promise<string | undefined>,
) =>
	dedupe((async () => {
		const userId = await userIdGetter();
		return userId ? { userID: userId } : undefined;
	}) satisfies Identify<StatsigUser>);

export const identifyAnonymousUser = () => Promise.resolve("anonymous-user");
