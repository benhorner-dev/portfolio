import { createPostHogAdapter } from "@flags-sdk/posthog";
import { flag } from "flags/next";
export function identify() {
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
	identify,
	defaultValue: false,
});
