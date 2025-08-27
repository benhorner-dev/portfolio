import * as Sentry from "@sentry/nextjs";
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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
