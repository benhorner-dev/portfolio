import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { Environment } from "./lib/constants";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	integrations: [Sentry.replayIntegration()],
	tracesSampleRate: 1,
	enableLogs: true,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	debug: false,
	environment: process.env.VERCEL_ENV || Environment.DEVELOPMENT,
});
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
posthog.init(POSTHOG_KEY, {
	api_host: "/ingest",
	ui_host: "https://us.posthog.com",
	defaults: "2025-05-24",
	capture_exceptions: true,
	debug: process.env.NODE_ENV === "development",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
