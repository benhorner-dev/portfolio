import * as Sentry from "@sentry/nextjs";
import { Environment } from "@/lib/constants";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	tracesSampleRate: 1,
	enableLogs: true,
	debug: false,
	environment: process.env.VERCEL_ENV || Environment.DEVELOPMENT,
});
