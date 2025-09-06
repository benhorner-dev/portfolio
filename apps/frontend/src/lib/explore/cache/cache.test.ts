import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/kv", () => ({
	kv: {
		get: vi.fn(),
		set: vi.fn(),
		hget: vi.fn(),
		hset: vi.fn(),
	},
}));

vi.mock("redis", () => ({
	createClient: vi.fn(() => ({
		connect: vi.fn(),
		get: vi.fn(),
		set: vi.fn(),
		hGet: vi.fn(),
		hSet: vi.fn(),
	})),
}));

describe("Cache", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	describe("getCache environment branching", () => {
		it("returns LocalCache when NODE_ENV is development", async () => {
			vi.stubEnv("NODE_ENV", "development");
			vi.stubEnv("REDIS_URL", "redis://localhost:6379");

			const { getCache } = await import("@/lib/explore/cache");
			const cache = await getCache();
			expect(cache.constructor.name).toBe("LocalCache");
		});

		it("returns ProdCache when NODE_ENV is production", async () => {
			vi.stubEnv("NODE_ENV", "production");

			const { getCache } = await import("@/lib/explore/cache/cache");
			const cache = await getCache();
			expect(cache.constructor.name).toBe("ProdCache");
		});

		it("returns ProdCache when NODE_ENV is not development", async () => {
			vi.stubEnv("NODE_ENV", "staging");

			const { getCache } = await import("@/lib/explore/cache/cache");
			const cache = await getCache();
			expect(cache.constructor.name).toBe("ProdCache");
		});
	});

	describe("LocalCache client creation branching", () => {
		it("creates client only once on first call", async () => {
			vi.stubEnv("NODE_ENV", "development");
			vi.stubEnv("REDIS_URL", "redis://localhost:6379");

			const { createClient } = await import("redis");
			const mockClient = {
				connect: vi.fn(),
				get: vi.fn().mockResolvedValue("test-value"),
				set: vi.fn(),
				hGet: vi.fn(),
				hSet: vi.fn(),
			};
			vi.mocked(createClient).mockReturnValue(mockClient as any);

			const { getCache } = await import("@/lib/explore/cache/cache");
			const cache = await getCache();

			await cache.get("test-key");
			expect(createClient).toHaveBeenCalledTimes(1);
			expect(mockClient.connect).toHaveBeenCalledTimes(1);

			await cache.get("another-key");
			expect(createClient).toHaveBeenCalledTimes(1);
			expect(mockClient.connect).toHaveBeenCalledTimes(1);
		});

		it("creates client with correct URL", async () => {
			vi.stubEnv("NODE_ENV", "development");
			vi.stubEnv("REDIS_URL", "redis://custom:6379");

			const { createClient } = await import("redis");
			const mockClient = {
				connect: vi.fn(),
				get: vi.fn(),
				set: vi.fn(),
				hGet: vi.fn(),
				hSet: vi.fn(),
			};
			vi.mocked(createClient).mockReturnValue(mockClient as any);

			const { getCache } = await import("@/lib/explore/cache/");
			const cache = await getCache();

			await cache.get("test-key");

			expect(createClient).toHaveBeenCalledWith({
				url: "redis://custom:6379",
			});
		});
	});

	describe("LocalCache methods", () => {
		it("calls all LocalCache methods", async () => {
			vi.stubEnv("NODE_ENV", "development");
			vi.stubEnv("REDIS_URL", "redis://localhost:6379");

			const { createClient } = await import("redis");
			const mockClient = {
				connect: vi.fn(),
				get: vi.fn().mockResolvedValue("get-value"),
				set: vi.fn(),
				hGet: vi.fn().mockResolvedValue("hget-value"),
				hSet: vi.fn(),
			};
			vi.mocked(createClient).mockReturnValue(mockClient as any);

			const { getCache } = await import("@/lib/explore/cache/cache");
			const cache = await getCache();

			const getValue = await cache.get("test-key");
			expect(getValue).toBe("get-value");
			expect(mockClient.get).toHaveBeenCalledWith("test-key");

			await cache.set("test-key", "test-value");
			expect(mockClient.set).toHaveBeenCalledWith("test-key", "test-value");

			const hgetValue = await cache.hget("hash-key", "field");
			expect(hgetValue).toBe("hget-value");
			expect(mockClient.hGet).toHaveBeenCalledWith("hash-key", "field");

			await cache.hset("hash-key", "field", "value");
			expect(mockClient.hSet).toHaveBeenCalledWith(
				"hash-key",
				"field",
				"value",
			);
		});
	});

	describe("ProdCache methods", () => {
		it("calls all ProdCache methods", async () => {
			vi.stubEnv("NODE_ENV", "production");

			const { kv } = await import("@vercel/kv");
			vi.mocked(kv.get).mockResolvedValue("prod-get-value");
			vi.mocked(kv.hget).mockResolvedValue("prod-hget-value");

			const { getCache } = await import("@/lib/explore/cache/cache");
			const cache = await getCache();

			const getValue = await cache.get("test-key");
			expect(getValue).toBe("prod-get-value");
			expect(kv.get).toHaveBeenCalledWith("test-key");

			await cache.set("test-key", "test-value");
			expect(kv.set).toHaveBeenCalledWith("test-key", "test-value");

			const hgetValue = await cache.hget("hash-key", "field");
			expect(hgetValue).toBe("prod-hget-value");
			expect(kv.hget).toHaveBeenCalledWith("hash-key", "field");

			await cache.hset("hash-key", "field", "value");
			expect(kv.hset).toHaveBeenCalledWith("hash-key", { field: "value" });
		});
	});
});
