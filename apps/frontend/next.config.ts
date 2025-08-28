import { withSentryConfig } from "@sentry/nextjs";
import withVercelToolbar from "@vercel/toolbar/plugins/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default withVercelToolbar()(
	withSentryConfig(nextConfig, {
		org: "benhornerdev",
		project: "portfolio",
		authToken: process.env.SENTRY_AUTH_TOKEN,
		silent: !process.env.CI,
		widenClientFileUpload: true,
		tunnelRoute: "/monitoring",
		disableLogger: true,
		automaticVercelMonitors: true,
	}),
);
