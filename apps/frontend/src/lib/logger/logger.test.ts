import * as Sentry from "@sentry/nextjs";
import type { Logger as PinoLogger } from "pino";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	ClientDevelopmentLogger,
	ClientProductionLogger,
	getLogger,
	getPinoLogger,
	LogLevel,
	ServerDevelopmentLogger,
	ServerProductionLogger,
} from "@/lib/logger";

const mockPinoLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
	trace: vi.fn(),
	child: vi.fn(() => mockPinoLogger),
	level: "info",
	fatal: vi.fn(),
	silent: vi.fn(),
	msgPrefix: "",
} as unknown as unknown as PinoLogger;

vi.mock("pino", () => ({
	default: vi.fn(() => mockPinoLogger),
}));

vi.mock("@sentry/nextjs", () => ({
	addBreadcrumb: vi.fn(),
	captureException: vi.fn(),
	captureMessage: vi.fn(),
}));

describe("getLogger", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "info").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "debug").mockImplementation(() => {});
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("browser environment", () => {
		it("should throw error when used in browser environment", () => {
			vi.stubGlobal("window", {});

			const logger = getLogger();
			expect(logger).toBeInstanceOf(ClientDevelopmentLogger);
			vi.unstubAllGlobals();
		});
	});

	describe("production environment", () => {
		beforeEach(() => {
			vi.stubGlobal("window", undefined);
		});

		it("should return pino logger in production with default info level", () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.stubEnv("LOG_LEVEL", undefined);

			const logger = getLogger();

			expect(logger).toBeDefined();
			expect(typeof logger.info).toBe("function");
			expect(typeof logger.error).toBe("function");
			expect(typeof logger.warn).toBe("function");
			expect(typeof logger.debug).toBe("function");
			expect(typeof logger.trace).toBe("function");
			expect(typeof logger.child).toBe("function");
		});

		it("should use custom log level when LOG_LEVEL is set", () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.stubEnv("LOG_LEVEL", "debug");

			const logger = getLogger();

			expect(logger).toBeDefined();
		});
	});

	describe("development environment", () => {
		beforeEach(() => {
			vi.stubEnv("NODE_ENV", "development");
			vi.stubGlobal("window", undefined);
		});

		it("should return development logger with console methods", () => {
			const logger = getLogger();

			expect(logger).toBeDefined();
			expect(logger.level).toBe("debug");
			expect(typeof logger.info).toBe("function");
			expect(typeof logger.error).toBe("function");
			expect(typeof logger.warn).toBe("function");
			expect(typeof logger.debug).toBe("function");
			expect(typeof logger.trace).toBe("function");
			expect(typeof logger.child).toBe("function");
		});

		it("should log info messages with correct format", () => {
			const logger = getLogger();
			const consoleSpy = vi.spyOn(console, "info");

			logger.info("Test message", "arg1", "arg2");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^🔵 .*\[SERVER-INFO\]$/),
				"Test message",
				"arg1",
				"arg2",
			);
		});

		it("should log error messages with correct format", () => {
			const logger = getLogger();
			const consoleSpy = vi.spyOn(console, "error");

			logger.error("Error message", "error details");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^🔴 .*\[SERVER-ERROR\]$/),
				"Error message",
				"error details",
			);
		});

		it("should log warn messages with correct format", () => {
			const logger = getLogger();
			const consoleSpy = vi.spyOn(console, "warn");

			logger.warn("Warning message");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^🟡 .*\[SERVER-WARN\]$/),
				"Warning message",
			);
		});

		it("should log debug messages with correct format", () => {
			const logger = getLogger();
			const consoleSpy = vi.spyOn(console, "debug");

			logger.debug("Debug message");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^🟣.*\[SERVER-DEBUG\]$/),
				"Debug message",
			);
		});

		it("should log trace messages with correct format", () => {
			const logger = getLogger();
			const consoleSpy = vi.spyOn(console, "log");

			logger.trace("Trace message");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^⚪.*\[SERVER-TRACE\]$/),
				"Trace message",
			);
		});

		it("should return same logger instance from child method", () => {
			const logger = getLogger();
			const childLogger = logger.child();

			const loggerType = typeof logger;
			const childLoggerType = typeof childLogger;

			expect(loggerType).toBe(childLoggerType);
		});

		it("should handle various message types", () => {
			const logger = getLogger();
			const consoleSpy = vi.spyOn(console, "info");

			const testObj = { key: "value" };
			logger.info(testObj);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^🔵.*\[SERVER-INFO\]$/),
				testObj,
			);

			logger.info(42);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^🔵.*\[SERVER-INFO\]$/),
				42,
			);
		});
	});

	describe("edge cases", () => {
		beforeEach(() => {
			vi.stubGlobal("window", undefined);
		});

		it("should work when NODE_ENV is not set", () => {
			vi.stubEnv("NODE_ENV", undefined);

			const logger = getLogger();

			expect(logger).toBeDefined();
			expect(logger.level).toBe("debug");
		});

		it("should work with empty LOG_LEVEL in production", () => {
			vi.stubEnv("NODE_ENV", "production");
			vi.stubEnv("LOG_LEVEL", "");

			const logger = getLogger();

			expect(logger).toBeDefined();
		});
	});
});

describe("ClientProductionLogger", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should add breadcrumb for info messages", () => {
		const logger = new ClientProductionLogger();
		logger.info("Test info message", { key: "value" });

		expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
			message: 'Test info message {"key":"value"}',
			level: LogLevel.INFO,
			category: "client-log",
		});
	});

	it("should add breadcrumb for warn messages", () => {
		const logger = new ClientProductionLogger();
		logger.warn("Test warning", 123);

		expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
			message: "Test warning 123",
			level: LogLevel.WARNING,
			category: "client-log",
		});
	});

	it("should capture exception for error with Error object", () => {
		const logger = new ClientProductionLogger();
		const error = new Error("Test error");

		logger.error(error);

		expect(console.error).toHaveBeenCalledWith("{}");
		expect(Sentry.captureException).toHaveBeenCalledWith(error);
	});

	it("should capture message for error with string", () => {
		const logger = new ClientProductionLogger();

		logger.error("String error message");

		expect(console.error).toHaveBeenCalledWith("String error message");
		expect(Sentry.captureMessage).toHaveBeenCalledWith(
			"String error message",
			LogLevel.ERROR,
		);
	});

	it("should add breadcrumb for debug when SENTRY_DEBUG is true", () => {
		vi.stubEnv("SENTRY_DEBUG", "true");
		const logger = new ClientProductionLogger();

		logger.debug("Debug message");

		expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
			message: "Debug message",
			level: LogLevel.DEBUG,
			category: "client-log",
		});
	});

	it("should not add breadcrumb for debug when SENTRY_DEBUG is not true", () => {
		vi.stubEnv("SENTRY_DEBUG", "false");
		const logger = new ClientProductionLogger();

		logger.debug("Debug message");

		expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
	});

	it("should return new instance from child method", () => {
		const logger = new ClientProductionLogger();
		const childLogger = logger.child({ service: "test" });

		expect(childLogger).toBeInstanceOf(ClientProductionLogger);
		expect(childLogger).not.toBe(logger);
	});

	it("should throw NotImplementedError for trace method", () => {
		const logger = new ClientProductionLogger();

		expect(() => logger.trace("trace message")).toThrow(
			"trace is not implemented in ClientProductionLogger",
		);
	});
});

describe("ClientDevelopmentLogger", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "info").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "debug").mockImplementation(() => {});
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should log info messages with correct format", () => {
		const logger = new ClientDevelopmentLogger();
		const consoleSpy = vi.spyOn(console, "info");

		logger.info("Client info message", { data: "test" });

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/^🔵 .*\[CLIENT-INFO\]$/),
			"Client info message",
			{ data: "test" },
		);
	});

	it("should log error messages with correct format", () => {
		const logger = new ClientDevelopmentLogger();
		const consoleSpy = vi.spyOn(console, "error");

		logger.error("Client error");

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/^🔴 .*\[CLIENT-ERROR\]$/),
			"Client error",
		);
	});

	it("should log warn messages with correct format", () => {
		const logger = new ClientDevelopmentLogger();
		const consoleSpy = vi.spyOn(console, "warn");

		logger.warn("Client warning");

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/^🟡 .*\[CLIENT-WARN\]$/),
			"Client warning",
		);
	});

	it("should log debug messages with correct format", () => {
		const logger = new ClientDevelopmentLogger();
		const consoleSpy = vi.spyOn(console, "debug");

		logger.debug("Client debug");

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/^🟣 .*\[CLIENT-DEBUG\]$/),
			"Client debug",
		);
	});

	it("should log trace messages with correct format", () => {
		const logger = new ClientDevelopmentLogger();
		const consoleSpy = vi.spyOn(console, "log");

		logger.trace("Trace message");

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/^⚪ .*\[CLIENT-TRACE\]$/),
			"Trace message",
		);
	});

	it("should return new instance from child method", () => {
		const logger = new ClientDevelopmentLogger();
		const childLogger = logger.child({ service: "test" });

		expect(childLogger).toBeInstanceOf(ClientDevelopmentLogger);
		expect(childLogger).not.toBe(logger);
	});
});

describe("ServerProductionLogger", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should initialize with custom log level from environment", () => {
		vi.stubEnv("LOG_LEVEL", "debug");
		const logger = new ServerProductionLogger(mockPinoLogger);

		expect(logger.level).toBe("debug");
	});

	it("should initialize with default log level when not set", () => {
		vi.stubEnv("LOG_LEVEL", undefined);
		const logger = new ServerProductionLogger(mockPinoLogger);

		expect(logger.level).toBe("info");
	});

	it("should log info messages to pino and add Sentry breadcrumb", () => {
		const logger = new ServerProductionLogger(mockPinoLogger);

		logger.info("Server info message", { data: "test" });

		expect(mockPinoLogger.info).toHaveBeenCalledWith(
			'Server info message {"data":"test"}',
		);
		expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
			message: 'Server info message {"data":"test"}',
			level: LogLevel.INFO,
			category: "server-log",
		});
	});

	it("should log error to pino and capture exception for Error objects", () => {
		const logger = new ServerProductionLogger(mockPinoLogger);
		const error = new Error("Server error");

		logger.error(error);

		expect(mockPinoLogger.error).toHaveBeenCalledWith("{}");
		expect(Sentry.captureException).toHaveBeenCalledWith(error);
	});

	it("should log error to pino and capture message for strings", () => {
		const logger = new ServerProductionLogger(mockPinoLogger);

		logger.error("String error message");

		expect(mockPinoLogger.error).toHaveBeenCalledWith("String error message");
		expect(Sentry.captureMessage).toHaveBeenCalledWith(
			"String error message",
			LogLevel.ERROR,
		);
	});

	it("should log warn messages to pino and add Sentry breadcrumb", () => {
		const logger = new ServerProductionLogger(mockPinoLogger);

		logger.warn("Server warning");

		expect(mockPinoLogger.warn).toHaveBeenCalledWith("Server warning");
		expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
			message: "Server warning",
			level: LogLevel.WARNING,
			category: "server-log",
		});
	});

	it("should log debug to pino and add breadcrumb when SENTRY_DEBUG is true", () => {
		vi.stubEnv("SENTRY_DEBUG", "true");
		const logger = new ServerProductionLogger(mockPinoLogger);

		logger.debug("Debug message");

		expect(mockPinoLogger.debug).toHaveBeenCalledWith("Debug message");
		expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
			message: "Debug message",
			level: LogLevel.DEBUG,
			category: "server-log",
		});
	});

	it("should log debug to pino but not add breadcrumb when SENTRY_DEBUG is false", () => {
		vi.stubEnv("SENTRY_DEBUG", "false");
		const logger = new ServerProductionLogger(mockPinoLogger);

		logger.debug("Debug message");

		expect(mockPinoLogger.debug).toHaveBeenCalledWith("Debug message");
		expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
	});

	it("should log trace messages to pino only", () => {
		const logger = new ServerProductionLogger(mockPinoLogger);

		logger.trace("Trace message");

		expect(mockPinoLogger.info).toHaveBeenCalledWith("Trace message");
	});

	it("should create child logger with pino child", () => {
		const logger = new ServerProductionLogger(mockPinoLogger);
		const childLogger = logger.child({ service: "child-service" });

		expect(mockPinoLogger.child).toHaveBeenCalledWith({
			service: "child-service",
		});
		expect(childLogger).toBeInstanceOf(ServerProductionLogger);
	});

	it("should create child logger with empty object when no param provided", () => {
		const logger = new ServerProductionLogger(mockPinoLogger);
		const childLogger = logger.child();

		expect(mockPinoLogger.child).toHaveBeenCalledWith({});
		expect(childLogger).toBeInstanceOf(ServerProductionLogger);
	});
});

describe("ServerDevelopmentLogger", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "info").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(console, "debug").mockImplementation(() => {});
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should log info messages with correct format", () => {
		const logger = new ServerDevelopmentLogger();
		const consoleSpy = vi.spyOn(console, "info");

		logger.info("Server info", { data: "test" });

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/^🔵 .*\[SERVER-INFO\]$/),
			"Server info",
			{ data: "test" },
		);
	});

	it("should log error messages with correct format", () => {
		const logger = new ServerDevelopmentLogger();
		const consoleSpy = vi.spyOn(console, "error");

		logger.error("Server error");

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/^🔴 .*\[SERVER-ERROR\]$/),
			"Server error",
		);
	});

	it("should log warn messages with correct format", () => {
		const logger = new ServerDevelopmentLogger();
		const consoleSpy = vi.spyOn(console, "warn");

		logger.warn("Server warning");

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/^🟡 .*\[SERVER-WARN\]$/),
			"Server warning",
		);
	});

	it("should log debug messages with correct format", () => {
		const logger = new ServerDevelopmentLogger();
		const consoleSpy = vi.spyOn(console, "debug");

		logger.debug("Server debug");

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/^🟣 .*\[SERVER-DEBUG\]$/),
			"Server debug",
		);
	});

	it("should log trace messages with correct format", () => {
		const logger = new ServerDevelopmentLogger();
		const consoleSpy = vi.spyOn(console, "log");

		logger.trace("Server trace");

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringMatching(/^⚪ .*\[SERVER-TRACE\]$/),
			"Server trace",
		);
	});

	it("should return new instance from child method", () => {
		const logger = new ServerDevelopmentLogger();
		const childLogger = logger.child({ service: "test" });

		expect(childLogger).toBeInstanceOf(ServerDevelopmentLogger);
		expect(childLogger).not.toBe(logger);
	});
});

describe("getPinoLogger", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should create pino logger with default settings", () => {
		vi.stubEnv("LOG_LEVEL", undefined);
		vi.stubEnv("NODE_ENV", "test");

		const logger = getPinoLogger("test-service");

		expect(logger).toBeDefined();
	});

	it("should create pino logger with custom log level", () => {
		vi.stubEnv("LOG_LEVEL", "debug");
		vi.stubEnv("NODE_ENV", "development");

		const logger = getPinoLogger("custom-service");

		expect(logger).toBeDefined();
	});
});

describe("getLogger production scenarios", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should return ClientProductionLogger for browser production", () => {
		vi.stubGlobal("window", {});
		const logger = getLogger("test-service", true, false);

		expect(logger).toBeInstanceOf(ClientProductionLogger);
		vi.unstubAllGlobals();
	});

	it("should return ServerProductionLogger for server production", () => {
		vi.stubGlobal("window", undefined);
		const logger = getLogger("test-service", true, true);

		expect(logger).toBeInstanceOf(ServerProductionLogger);
	});

	it("should auto-detect server environment when isServer undefined", () => {
		vi.stubGlobal("window", undefined);
		const logger = getLogger("test-service", true);

		expect(logger).toBeInstanceOf(ServerProductionLogger);
	});

	it("should auto-detect production environment when isProduction undefined", () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.stubGlobal("window", undefined);
		const logger = getLogger("test-service");

		expect(logger).toBeInstanceOf(ServerProductionLogger);
	});
});
