import { describe, expect, it, vi } from "vitest";
import { type ConfigLoadErrorHandler, configLoader } from "@/lib/configLoader";

describe("ConfigLoader", () => {
	it("should call error handler when file read fails", () => {
		const mockErrorHandler = vi.fn((_: unknown, __: { configPath: string }) => {
			throw new Error("Custom error");
		}) as ConfigLoadErrorHandler;

		expect(() => configLoader("./nonexistent.json", mockErrorHandler)).toThrow(
			"Custom error",
		);

		expect(mockErrorHandler).toHaveBeenCalledWith(expect.any(Error), {
			configPath: "./nonexistent.json",
		});
	});

	it("should call error handler with correct context", () => {
		const mockErrorHandler = vi.fn(
			(error: unknown, context: { configPath: string }) => {
				expect(context.configPath).toBe("./test.json");
				expect(error).toBeInstanceOf(Error);
				throw new Error("Context verified");
			},
		) as ConfigLoadErrorHandler;

		expect(() => configLoader("./test.json", mockErrorHandler)).toThrow(
			"Context verified",
		);

		expect(mockErrorHandler).toHaveBeenCalledWith(expect.any(Error), {
			configPath: "./test.json",
		});
	});

	it("should allow custom error transformation in error handler", () => {
		const customErrorHandler: ConfigLoadErrorHandler = (
			error: unknown,
			_: { configPath: string },
		) => {
			if (error instanceof Error) {
				throw new Error(`Custom error message: ${error.message}`);
			}
			throw new Error("Unknown error occurred");
		};

		expect(() => configLoader("./invalid.json", customErrorHandler)).toThrow(
			/Custom error message:/,
		);
	});
});
