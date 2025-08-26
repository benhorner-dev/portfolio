import pino from "pino";

export interface Logger {
	info: (msg: unknown, ...args: unknown[]) => void;
	error: (msg: unknown, ...args: unknown[]) => void;
	warn: (msg: unknown, ...args: unknown[]) => void;
	debug: (msg: unknown, ...args: unknown[]) => void;
	trace: (msg: unknown, ...args: unknown[]) => void;
	child: (obj?: unknown) => Logger;
	level: string;
}

export function getLogger(): Logger {
	if (typeof window !== "undefined") {
		throw new Error("Logger can only be used on the server side");
	}

	const isProduction = process.env.NODE_ENV === "production";

	if (isProduction) {
		return pino({
			level: process.env.LOG_LEVEL || "info",
			base: {
				env: process.env.NODE_ENV,
				service: "nexties-agent",
			},
		}) as Logger;
	}

	const timestamp = () => new Date().toLocaleTimeString();

	const devLogger: Logger = {
		info: (msg: unknown, ...args: unknown[]) => {
			console.info(`🔵 ${timestamp()} [INFO]`, msg, ...args);
		},
		trace: (msg: unknown, ...args: unknown[]) => {
			console.log(`⚪ ${timestamp()} [TRACE]`, msg, ...args);
		},
		error: (msg: unknown, ...args: unknown[]) => {
			console.error(`🔴 ${timestamp()} [ERROR]`, msg, ...args);
		},
		warn: (msg: unknown, ...args: unknown[]) => {
			console.warn(`🟡 ${timestamp()} [WARN]`, msg, ...args);
		},
		debug: (msg: unknown, ...args: unknown[]) => {
			console.debug(`🟣 ${timestamp()} [DEBUG]`, msg, ...args);
		},
		child: (_obj?: unknown) => devLogger,
		level: "debug",
	};

	return devLogger;
}
