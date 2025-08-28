import * as Sentry from "@sentry/nextjs";
import type { Logger as PinoLogger } from "pino";
import { Environment } from "../constants";

export interface Logger {
	info: (msg: unknown, ...args: unknown[]) => void;
	error: (msg: unknown, ...args: unknown[]) => void;
	warn: (msg: unknown, ...args: unknown[]) => void;
	debug: (msg: unknown, ...args: unknown[]) => void;
	trace: (msg: unknown, ...args: unknown[]) => void;
	child: (obj?: unknown) => Logger;
	level: string;
}

const DEFAULT_SERVICE = "benhorner-portfolio";

export enum LogLevel {
	INFO = "info",
	ERROR = "error",
	WARNING = "warning",
	DEBUG = "debug",
	FATAL = "fatal",
}

enum LogCategory {
	CLIENT_LOG = "client-log",
	SERVER_LOG = "server-log",
}

enum LogLevelDefault {
	INFO = "info",
	DEBUG = "debug",
}

class NotImplementedError extends Error {
	constructor(method: string, className: string) {
		super(`${method} is not implemented in ${className}`);
		this.name = "NotImplementedError";
	}
}

abstract class BaseLogger implements Logger {
	abstract level: string;
	abstract info(msg: unknown, ...args: unknown[]): void;
	abstract error(msg: unknown, ...args: unknown[]): void;
	abstract warn(msg: unknown, ...args: unknown[]): void;
	abstract debug(msg: unknown, ...args: unknown[]): void;
	abstract child(obj?: unknown): Logger;

	trace(_: unknown, ...__: unknown[]): void {
		throw new NotImplementedError("trace", this.constructor.name);
	}

	protected formatMessage(msg: unknown, args: unknown[]): string {
		return [msg, ...args]
			.map((val) => (typeof val === "string" ? val : JSON.stringify(val)))
			.join(" ");
	}
}

export class ClientProductionLogger extends BaseLogger {
	level = LogLevelDefault.INFO;

	info(msg: unknown, ...args: unknown[]) {
		const message = this.formatMessage(msg, args);
		Sentry.addBreadcrumb({
			message,
			level: LogLevel.INFO,
			category: LogCategory.CLIENT_LOG,
		});
	}

	error(msg: unknown, ...args: unknown[]) {
		const message = this.formatMessage(msg, args);
		console.error(message);

		if (msg instanceof Error) {
			return Sentry.captureException(msg);
		}
		Sentry.captureMessage(message, LogLevel.ERROR);
	}

	warn(msg: unknown, ...args: unknown[]) {
		const message = this.formatMessage(msg, args);
		Sentry.addBreadcrumb({
			message,
			level: LogLevel.WARNING,
			category: LogCategory.CLIENT_LOG,
		});
	}

	debug(msg: unknown, ...args: unknown[]) {
		if (process.env.SENTRY_DEBUG !== Environment.TRUE) {
			return;
		}
		const message = this.formatMessage(msg, args);
		Sentry.addBreadcrumb({
			message,
			level: LogLevel.DEBUG,
			category: LogCategory.CLIENT_LOG,
		});
	}

	child(_obj?: unknown): Logger {
		return new ClientProductionLogger();
	}
}

export class ClientDevelopmentLogger extends BaseLogger {
	level = LogLevelDefault.DEBUG;
	private timestamp = () => new Date().toLocaleTimeString();

	info(msg: unknown, ...args: unknown[]) {
		console.info(`🔵 ${this.timestamp()} [CLIENT-INFO]`, msg, ...args);
	}

	error(msg: unknown, ...args: unknown[]) {
		console.error(`🔴 ${this.timestamp()} [CLIENT-ERROR]`, msg, ...args);
	}

	warn(msg: unknown, ...args: unknown[]) {
		console.warn(`🟡 ${this.timestamp()} [CLIENT-WARN]`, msg, ...args);
	}

	debug(msg: unknown, ...args: unknown[]) {
		console.debug(`🟣 ${this.timestamp()} [CLIENT-DEBUG]`, msg, ...args);
	}

	trace(msg: unknown, ...args: unknown[]) {
		console.log(`⚪ ${this.timestamp()} [CLIENT-TRACE]`, msg, ...args);
	}

	child(_obj?: unknown): Logger {
		return new ClientDevelopmentLogger();
	}
}

export class ServerProductionLogger extends BaseLogger {
	private pinoLogger: PinoLogger;
	level: string;

	constructor(pinoLogger: PinoLogger) {
		super();
		this.pinoLogger = pinoLogger;
		this.level = process.env.LOG_LEVEL || LogLevelDefault.INFO;
	}

	info(msg: unknown, ...args: unknown[]) {
		const message = this.formatMessage(msg, args);
		this.pinoLogger.info(message);
		Sentry.addBreadcrumb({
			message,
			level: LogLevel.INFO,
			category: LogCategory.SERVER_LOG,
		});
	}

	error(msg: unknown, ...args: unknown[]) {
		const message = this.formatMessage(msg, args);
		this.pinoLogger.error(message);

		if (msg instanceof Error) {
			return Sentry.captureException(msg);
		}
		Sentry.captureMessage(message, LogLevel.ERROR);
	}

	warn(msg: unknown, ...args: unknown[]) {
		const message = this.formatMessage(msg, args);
		this.pinoLogger.warn(message);
		Sentry.addBreadcrumb({
			message,
			level: LogLevel.WARNING,
			category: LogCategory.SERVER_LOG,
		});
	}

	debug(msg: unknown, ...args: unknown[]) {
		const message = this.formatMessage(msg, args);
		this.pinoLogger.debug(message);
		if (process.env.SENTRY_DEBUG !== Environment.TRUE) {
			return;
		}
		Sentry.addBreadcrumb({
			message,
			level: LogLevel.DEBUG,
			category: LogCategory.SERVER_LOG,
		});
	}

	trace(msg: unknown, ...args: unknown[]) {
		const message = this.formatMessage(msg, args);
		this.pinoLogger.trace(message);
	}

	child(obj?: unknown): Logger {
		const childLogger = this.pinoLogger.child(obj || {});
		return new ServerProductionLogger(childLogger);
	}
}

export class ServerDevelopmentLogger extends BaseLogger {
	level = LogLevelDefault.DEBUG;
	private timestamp = () => new Date().toLocaleTimeString();

	info(msg: unknown, ...args: unknown[]) {
		console.info(`🔵 ${this.timestamp()} [SERVER-INFO]`, msg, ...args);
	}

	error(msg: unknown, ...args: unknown[]) {
		console.error(`🔴 ${this.timestamp()} [SERVER-ERROR]`, msg, ...args);
	}

	warn(msg: unknown, ...args: unknown[]) {
		console.warn(`🟡 ${this.timestamp()} [SERVER-WARN]`, msg, ...args);
	}

	debug(msg: unknown, ...args: unknown[]) {
		console.debug(`🟣 ${this.timestamp()} [SERVER-DEBUG]`, msg, ...args);
	}

	trace(msg: unknown, ...args: unknown[]) {
		console.log(`⚪ ${this.timestamp()} [SERVER-TRACE]`, msg, ...args);
	}

	child(_obj?: unknown): Logger {
		return new ServerDevelopmentLogger();
	}
}

export const getPinoLogger = (service: string): PinoLogger => {
	const pino = require("pino") as typeof import("pino");
	const pinoLogger = pino({
		level: process.env.LOG_LEVEL || LogLevelDefault.INFO,
		base: {
			env: process.env.NODE_ENV,
			service: service,
		},
	});
	return pinoLogger;
};

export function getLogger(
	service = DEFAULT_SERVICE,
	isProduction?: boolean,
	isServer?: boolean,
): Logger {
	if (isProduction === undefined) {
		isProduction = process.env.NODE_ENV === Environment.PRODUCTION;
	}

	if (isServer === undefined) {
		isServer = typeof window === "undefined";
	}

	if (!isServer && isProduction) {
		return new ClientProductionLogger();
	}

	if (!isServer) {
		return new ClientDevelopmentLogger();
	}

	if (!isProduction) {
		return new ServerDevelopmentLogger();
	}

	const pinoLogger = getPinoLogger(service);

	return new ServerProductionLogger(pinoLogger);
}
