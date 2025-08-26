import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLogger } from "@/lib/logger";

vi.mock("pino", () => ({
	default: vi.fn(() => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
		child: vi.fn(),
		level: "info",
	})),
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

			expect(() => getLogger()).toThrow(
				"Logger can only be used on the server side",
			);

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
				expect.stringMatching(/^🔵 .*\[INFO\]$/),
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
				expect.stringMatching(/^🔴 .*\[ERROR\]$/),
				"Error message",
				"error details",
			);
		});

		it("should log warn messages with correct format", () => {
			const logger = getLogger();
			const consoleSpy = vi.spyOn(console, "warn");

			logger.warn("Warning message");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^🟡 .*\[WARN\]$/),
				"Warning message",
			);
		});

		it("should log debug messages with correct format", () => {
			const logger = getLogger();
			const consoleSpy = vi.spyOn(console, "debug");

			logger.debug("Debug message");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^🟣.*\[DEBUG\]$/),
				"Debug message",
			);
		});

		it("should log trace messages with correct format", () => {
			const logger = getLogger();
			const consoleSpy = vi.spyOn(console, "log");

			logger.trace("Trace message");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^⚪.*\[TRACE\]$/),
				"Trace message",
			);
		});

		it("should return same logger instance from child method", () => {
			const logger = getLogger();
			const childLogger = logger.child({ service: "test" });

			expect(childLogger).toBe(logger);
		});

		it("should handle various message types", () => {
			const logger = getLogger();
			const consoleSpy = vi.spyOn(console, "info");

			const testObj = { key: "value" };
			logger.info(testObj);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^🔵.*\[INFO\]$/),
				testObj,
			);

			logger.info(42);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringMatching(/^🔵.*\[INFO\]$/),
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
