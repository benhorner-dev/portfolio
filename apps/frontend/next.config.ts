import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const isStorybook = process.env.STORYBOOK === "true";

const nextConfig: NextConfig = {
	experimental: {
		ppr: isStorybook ? undefined : "incremental",
	},
	images: {
		qualities: [85],
	},
	async rewrites() {
		return [
			{
				source: "/ingest/static/:path*",
				destination: "https://us-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/ingest/:path*",
				destination: "https://us.i.posthog.com/:path*",
			},
		];
	},
	skipTrailingSlashRedirect: true,
};

export default withSentryConfig(nextConfig, {
	org: "benhornerdev",
	project: "portfolio",
	authToken: process.env.SENTRY_AUTH_TOKEN,
	silent: !process.env.CI,
	widenClientFileUpload: true,
	tunnelRoute: "/monitoring",
	disableLogger: true,
	automaticVercelMonitors: true,
});
