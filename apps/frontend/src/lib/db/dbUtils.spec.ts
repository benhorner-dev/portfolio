import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("drizzle-orm/postgres-js", () => ({
	drizzle: vi.fn(),
}));

vi.mock("postgres", () => ({
	default: vi.fn(),
}));

vi.mock("@neondatabase/serverless", () => ({
	neon: vi.fn(),
}));

vi.mock("drizzle-orm/neon-http", () => ({
	drizzle: vi.fn(),
}));

import { neon } from "@neondatabase/serverless";
import { drizzle as serverLessDrizzle } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/postgres-js";

import postgres from "postgres";
import { Environment } from "@/lib/constants";

const mockDrizzle = vi.mocked(drizzle);
const mockPostgres = vi.mocked(postgres);
const mockNeon = vi.mocked(neon);
const mockServerLessDrizzle = vi.mocked(serverLessDrizzle);

describe("getDb singleton pattern", () => {
	// secretlint-disable-next-line
	const testUri = "postgresql://test:test@localhost:5432/test";
	let mockSqlInstance: { end: ReturnType<typeof vi.fn> };
	let mockDbInstance: { mock: string };
	let mockNeonInstance: { mock: string };
	let mockProdDbInstance: { mock: string };

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();

		mockSqlInstance = {
			end: vi.fn().mockResolvedValue(undefined),
		};
		mockDbInstance = { mock: "database" };
		mockNeonInstance = { mock: "neon-client" };
		mockProdDbInstance = { mock: "prod-database" };

		mockPostgres.mockReturnValue(
			mockSqlInstance as unknown as ReturnType<typeof postgres>,
		);

		mockDrizzle.mockReturnValue(
			mockDbInstance as unknown as ReturnType<typeof drizzle>,
		);

		mockNeon.mockReturnValue(
			mockNeonInstance as unknown as ReturnType<typeof neon>,
		);

		mockServerLessDrizzle.mockReturnValue(
			mockProdDbInstance as unknown as ReturnType<typeof serverLessDrizzle>,
		);
	});

	afterEach(async () => {
		try {
			const { getDb } = await import("./utils");
			const connection = await getDb(testUri);
			await connection.close();
		} catch {}
	});

	it("should create connection on first call", async () => {
		const { getDb } = await import("./utils");

		const connection = await getDb(testUri);

		expect(mockPostgres).toHaveBeenCalledOnce();
		expect(mockPostgres).toHaveBeenCalledWith(testUri, {
			max: 1,
			idle_timeout: 20,
			max_lifetime: 60 * 30,
		});
		expect(mockDrizzle).toHaveBeenCalledOnce();
		expect(connection.db).toBe(mockDbInstance);
		expect(typeof connection.close).toBe("function");
	});

	it("should create production connection when env is production", async () => {
		const { getDb } = await import("./utils");

		const connection = await getDb(testUri, Environment.PRODUCTION);

		expect(mockNeon).toHaveBeenCalledOnce();
		expect(mockNeon).toHaveBeenCalledWith(testUri);
		expect(mockServerLessDrizzle).toHaveBeenCalledOnce();
		expect(mockServerLessDrizzle).toHaveBeenCalledWith(mockNeonInstance, {
			schema: expect.any(Object),
		});
		expect(connection.db).toBe(mockProdDbInstance);
		expect(typeof connection.close).toBe("function");

		expect(mockPostgres).not.toHaveBeenCalled();
		expect(mockDrizzle).not.toHaveBeenCalled();
	});

	it("should return same connection on subsequent calls (singleton behavior)", async () => {
		const { getDb } = await import("./utils");

		const connection1 = await getDb(testUri);
		const connection2 = await getDb(testUri);
		const connection3 = await getDb("different-uri");

		expect(mockPostgres).toHaveBeenCalledOnce();
		expect(mockDrizzle).toHaveBeenCalledOnce();

		expect(connection1.db).toBe(mockDbInstance);
		expect(connection2.db).toBe(mockDbInstance);
		expect(connection3.db).toBe(mockDbInstance);
		expect(connection1.db).toBe(connection2.db);
		expect(connection2.db).toBe(connection3.db);
	});

	it("should create new connection after close() is called", async () => {
		const { getDb } = await import("./utils");

		const connection1 = await getDb(testUri);
		await connection1.close();

		vi.clearAllMocks();
		mockPostgres.mockReturnValue(
			mockSqlInstance as unknown as ReturnType<typeof postgres>,
		);

		mockDrizzle.mockReturnValue(
			mockDbInstance as unknown as ReturnType<typeof drizzle>,
		);

		const connection2 = await getDb(testUri);

		expect(mockPostgres).toHaveBeenCalledOnce();
		expect(mockDrizzle).toHaveBeenCalledOnce();
		expect(connection2.db).toBe(mockDbInstance);
	});

	it("should call sql.end() when close() is called", async () => {
		const { getDb } = await import("./utils");

		const connection = await getDb(testUri);
		await connection.close();

		expect(mockSqlInstance.end).toHaveBeenCalledOnce();
	});

	it("should handle multiple close() calls safely", async () => {
		const { getDb } = await import("./utils");

		const connection = await getDb(testUri);
		await connection.close();
		await connection.close();

		expect(mockSqlInstance.end).toHaveBeenCalledOnce();
	});

	it("should throw DbClientError when postgres connection fails", async () => {
		mockPostgres.mockImplementation(() => {
			throw new Error("Connection failed");
		});

		const { getDb } = await import("./utils");
		const { DbClientError } = await import("./errors");

		let thrownError: unknown;
		try {
			await getDb(testUri);
		} catch (error) {
			thrownError = error;
		}

		expect(thrownError).toBeInstanceOf(DbClientError);
		expect((thrownError as InstanceType<typeof DbClientError>).message).toBe(
			"Failed to connect to database: Error: Connection failed",
		);
	});

	it("should throw DbClientError when drizzle initialization fails", async () => {
		mockDrizzle.mockImplementation(() => {
			throw new Error("Drizzle init failed");
		});

		const { getDb } = await import("./utils");
		const { DbClientError } = await import("./errors");

		let thrownError: unknown;
		try {
			await getDb(testUri);
		} catch (error) {
			thrownError = error;
		}

		expect(thrownError).toBeInstanceOf(DbClientError);
		expect((thrownError as InstanceType<typeof DbClientError>).message).toBe(
			"Failed to connect to database: Error: Drizzle init failed",
		);
	});
});

describe("dbOperation wrapper", () => {
	it("should execute operation successfully and return result", async () => {
		const { dbOperation } = await import("./utils");

		const mockOperation = vi.fn().mockResolvedValue("success");
		const wrappedOperation = await dbOperation(mockOperation);

		const result = await wrappedOperation("arg1", "arg2");

		expect(result).toBe("success");
		expect(mockOperation).toHaveBeenCalledWith("arg1", "arg2");
	});

	it("should wrap errors with DbOpError", async () => {
		const { dbOperation } = await import("./utils");
		const { DbOpError } = await import("./errors");
		const mockOperation = vi
			.fn()
			.mockRejectedValue(new Error("Database error"));
		Object.defineProperty(mockOperation, "name", { value: "testOperation" });
		const wrappedOperation = await dbOperation(mockOperation);

		await expect(wrappedOperation()).rejects.toBeInstanceOf(DbOpError);
		await expect(wrappedOperation()).rejects.toThrow(
			"Failed to testOperation:  \n\n Error: Database error",
		);
	});

	it("should handle unnamed operations", async () => {
		const { dbOperation } = await import("./utils");

		const mockOperation = vi
			.fn()
			.mockRejectedValue(new Error("Database error"));
		const wrappedOperation = await dbOperation(mockOperation);

		await expect(wrappedOperation()).rejects.toThrow(
			"Failed to spy:  \n\n Error: Database error",
		);
	});
});
