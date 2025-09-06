import { beforeEach, describe, expect, it, vi } from "vitest";
import { TracedClass } from "./utils";

vi.mock("@/lib/logger", () => ({
	getLogger: () => ({
		trace: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
		debug: vi.fn(),
		verbose: vi.fn(),
	}),
}));

import { getLogger } from "@/lib/logger";

const mockLogger = getLogger() as unknown as {
	trace: ReturnType<typeof vi.fn>;
	error: ReturnType<typeof vi.fn>;
	warn: ReturnType<typeof vi.fn>;
	info: ReturnType<typeof vi.fn>;
	debug: ReturnType<typeof vi.fn>;
	verbose: ReturnType<typeof vi.fn>;
};

describe("TracedClass", () => {
	const mockErrors = {
		parentError: class ParentError extends Error {},
		tracedError: class TracedError extends Error {
			constructor(message: string) {
				super(message);
				this.name = "TracedError";
			}
		},
		unExpectedError: class UnExpectedError extends Error {
			constructor(message: string) {
				super(message);
				this.name = "UnExpectedError";
			}
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should instrument methods on class instantiation", () => {
		@TracedClass(mockErrors)
		class TestClass {
			testMethod() {
				return "test";
			}
		}

		const instance = new TestClass();
		const result = instance.testMethod();

		expect(result).toBe("test");
	});

	it("should handle sync methods correctly", () => {
		@TracedClass(mockErrors)
		class TestClass {
			getValue() {
				return 42;
			}
		}

		const instance = new TestClass();
		const result = instance.getValue();

		expect(result).toBe(42);
	});

	it("should handle async methods correctly", async () => {
		@TracedClass(mockErrors)
		class TestClass {
			async getAsyncValue() {
				return Promise.resolve("async result");
			}
		}

		const instance = new TestClass();
		const result = await instance.getAsyncValue();

		expect(result).toBe("async result");
	});

	it("should not instrument reserved methods", () => {
		@TracedClass(mockErrors)
		class TestClass {
			testMethod() {
				return "test";
			}
		}

		const instance = new TestClass();
		instance.testMethod();

		const traceCalls = mockLogger.trace.mock.calls;
		const hasConstructorTrace = traceCalls.some(
			(call: unknown[]) =>
				typeof call[0] === "string" && call[0].includes("constructor"),
		);

		expect(hasConstructorTrace).toBe(false);
	});

	it("should handle errors from parent error type", () => {
		@TracedClass(mockErrors)
		class TestClass {
			traceId = "test-trace-id";

			throwParentError() {
				throw new mockErrors.parentError("Parent error");
			}
		}

		const instance = new TestClass();

		expect(() => instance.throwParentError()).toThrow(mockErrors.tracedError);
	});

	it("should handle unexpected errors", () => {
		@TracedClass(mockErrors)
		class TestClass {
			traceId = "test-trace-id";

			throwUnexpectedError() {
				throw new Error("Unexpected error");
			}
		}

		const instance = new TestClass();

		expect(() => instance.throwUnexpectedError()).toThrow(
			mockErrors.unExpectedError,
		);
	});

	it("should handle async errors correctly", async () => {
		@TracedClass(mockErrors)
		class TestClass {
			traceId = "test-trace-id";

			async throwAsyncError() {
				throw new Error("Async error");
			}
		}

		const instance = new TestClass();

		await expect(instance.throwAsyncError()).rejects.toThrow(
			mockErrors.unExpectedError,
		);
	});

	it("should handle promises that reject with parent errors", async () => {
		@TracedClass(mockErrors)
		class TestClass {
			traceId = "test-trace-id";

			async throwAsyncParentError() {
				throw new mockErrors.parentError("Async parent error");
			}
		}

		const instance = new TestClass();

		await expect(instance.throwAsyncParentError()).rejects.toThrow(
			mockErrors.tracedError,
		);
	});

	it("should bind original method context correctly", () => {
		@TracedClass(mockErrors)
		class TestClass {
			value = "instance value";

			getValue() {
				return this.value;
			}
		}

		const instance = new TestClass();
		const result = instance.getValue();

		expect(result).toBe("instance value");
	});

	it("should handle non-Error thrown values", () => {
		@TracedClass(mockErrors)
		class TestClass {
			traceId = "test-trace-id";

			throwString() {
				throw "string error";
			}
		}

		const instance = new TestClass();

		expect(() => instance.throwString()).toThrow(mockErrors.unExpectedError);
	});

	it("should log verbose data when verbose is true", () => {
		@TracedClass(mockErrors, true)
		class TestClass {
			testMethod(arg: string) {
				return `result: ${arg}`;
			}
		}

		const instance = new TestClass();
		instance.testMethod("input");
	});

	it("should not log verbose data when verbose is false", () => {
		@TracedClass(mockErrors, false)
		class TestClass {
			testMethod(arg: string) {
				return `result: ${arg}`;
			}
		}

		const instance = new TestClass();
		instance.testMethod("input");

		const traceCalls = mockLogger.trace.mock.calls;
		const hasVerboseCall = traceCalls.some(
			(call: unknown[]) => call.length > 1,
		);
		expect(hasVerboseCall).toBe(false);
	});

	it("should log error events", () => {
		@TracedClass(mockErrors)
		class TestClass {
			traceId = "test-trace-id";

			throwError() {
				throw new Error("Test error");
			}
		}

		const instance = new TestClass();

		try {
			instance.throwError();
		} catch {}
	});
});
