import { createPostHogAdapter } from "@flags-sdk/posthog";
import { type StatsigUser, statsigAdapter } from "@flags-sdk/statsig";
import { flag } from "flags/next";
import type { FeatureFlag } from "@/app/constants";
import { identifyStatsig } from "./lib/identity/statsig";

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

export const createFeatureFlag = (
	key: FeatureFlag,
	userIdGetter: () => Promise<string | undefined>,
) =>
	flag<boolean, StatsigUser>({
		key,
		adapter: statsigAdapter.featureGate((gate) => gate.value, {
			exposureLogging: true,
		}),
		identify: identifyStatsig(userIdGetter),
		defaultValue: false,
	});
