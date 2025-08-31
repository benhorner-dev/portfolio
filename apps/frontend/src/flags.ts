import { createPostHogAdapter } from "@flags-sdk/posthog";
import { type StatsigUser, statsigAdapter } from "@flags-sdk/statsig";
import type { Identify } from "flags";
import { dedupe, flag } from "flags/next";
import type { FeatureFlag } from "@/app/constants";

export function identifyPostHog() {
	return {
		distinctId: "anonymous-user",
		properties: {},
	};
}
const postHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (!postHogKey) {
	throw new Error("NEXT_PUBLIC_POSTHOG_KEY is not set");
}

const postHogAdapter = createPostHogAdapter({
	postHogKey,
	postHogOptions: {
		host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	},
});

export const chatEvalFlag = flag({
	key: "chat-eval",
	adapter: postHogAdapter.isFeatureEnabled(),
	identify: identifyPostHog,
	defaultValue: false,
});

export const identifyStatsig = dedupe((async () => ({
	userID: "anonymous-user",
})) satisfies Identify<StatsigUser>);

export const createFeatureFlag = (key: FeatureFlag) =>
	flag<boolean, StatsigUser>({
		key,
		adapter: statsigAdapter.featureGate((gate) => gate.value, {
			exposureLogging: true,
		}),
		identify: identifyStatsig,
	});
