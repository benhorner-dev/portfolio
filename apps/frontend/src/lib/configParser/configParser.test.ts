import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { configParser, type ErrorHandler } from "@/lib/configParser";

const TestConfigSchema = z.object({
	name: z.string(),
	age: z.number(),
	active: z.boolean(),
});

describe("configParser", () => {
	it("should parse valid config successfully", () => {
		const validConfig = {
			name: "John Doe",
			age: 30,
			active: true,
		};

		const result = configParser(TestConfigSchema, validConfig, (error) => {
			throw error;
		});

		expect(result.name).toBe("John Doe");
	});

	it("should throw error for invalid config format", () => {
		const invalidConfig = {
			name: 123,
		};

		expect(() =>
			configParser(TestConfigSchema, invalidConfig, (error) => {
				throw error;
			}),
		).toThrow(/Invalid input: expected string, received number/);
	});

	it("should handle non-ZodError exceptions", () => {
		vi.spyOn(TestConfigSchema, "parse").mockImplementation(() => {
			throw new Error("Some other error");
		});

		expect(() =>
			configParser(TestConfigSchema, { name: "test" }, (error) => {
				throw error;
			}),
		).toThrow("Some other error");

		vi.restoreAllMocks();
	});

	it("should call error handler with correct context for validation errors", () => {
		const mockErrorHandler = vi.fn(
			(_: unknown, __: { schema: z.ZodTypeAny; rawData: unknown }) => {
				throw new Error("Custom error");
			},
		) as ErrorHandler;

		const invalidConfig = { name: 123 };

		expect(() =>
			configParser(TestConfigSchema, invalidConfig, mockErrorHandler),
		).toThrow("Custom error");

		expect(mockErrorHandler).toHaveBeenCalledWith(expect.any(Error), {
			schema: TestConfigSchema,
			rawData: invalidConfig,
		});
	});

	it("should allow custom error transformation in error handler", () => {
		const customErrorHandler: ErrorHandler = (
			error: unknown,
			_: { schema: z.ZodTypeAny; rawData: unknown },
		) => {
			if (error instanceof Error) {
				throw new Error(`Custom error message: ${error.message}`);
			}
			throw new Error("Unknown error occurred");
		};

		const invalidConfig = { name: 123 };

		expect(() =>
			configParser(TestConfigSchema, invalidConfig, customErrorHandler),
		).toThrow(/Custom error message:/);
	});
});
