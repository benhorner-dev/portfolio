import { getProviderData as getPostHogProviderData } from "@flags-sdk/posthog";
import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";
import * as flags from "@/flags";

export const GET = createFlagsDiscoveryEndpoint(() => {
	if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
		throw new Error("POSTHOG_PERSONAL_API_KEY is not set");
	}

	if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID) {
		throw new Error("NEXT_PUBLIC_POSTHOG_PROJECT_ID is not set");
	}

	const postHogProviderData = getPostHogProviderData({
		personalApiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
		projectId: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID,
	});

	const {
		identifyPostHog: _,
		identifyStatsig: __,
		createFeatureFlag: ___,
		...featureFlags
	} = flags;

	const regularProviderData = getProviderData(featureFlags);

	return {
		...postHogProviderData,
		...regularProviderData,
	};
});
