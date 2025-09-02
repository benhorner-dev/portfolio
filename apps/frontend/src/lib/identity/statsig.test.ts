import { describe, expect, it, vi } from "vitest";
import { identifyAnonymousUser, identifyStatsig } from "./statsig";

vi.mock("flags/next", () => ({
	dedupe: vi.fn((fn) => fn),
}));

describe("statsig", () => {
	describe("identifyStatsig", () => {
		it("returns user object when userId is provided", async () => {
			const mockUserIdGetter = vi.fn().mockResolvedValue("test-user-123");
			const identify = identifyStatsig(mockUserIdGetter);

			const result = await identify();

			expect(result).toEqual({ userID: "test-user-123" });
			expect(mockUserIdGetter).toHaveBeenCalledOnce();
		});

		it("returns undefined when userId is not provided", async () => {
			const mockUserIdGetter = vi.fn().mockResolvedValue(undefined);
			const identify = identifyStatsig(mockUserIdGetter);

			const result = await identify();

			expect(result).toBeUndefined();
			expect(mockUserIdGetter).toHaveBeenCalledOnce();
		});

		it("returns undefined when userId is null", async () => {
			const mockUserIdGetter = vi.fn().mockResolvedValue(null);
			const identify = identifyStatsig(mockUserIdGetter);

			const result = await identify();

			expect(result).toBeUndefined();
			expect(mockUserIdGetter).toHaveBeenCalledOnce();
		});

		it("returns undefined when userId is empty string", async () => {
			const mockUserIdGetter = vi.fn().mockResolvedValue("");
			const identify = identifyStatsig(mockUserIdGetter);

			const result = await identify();

			expect(result).toBeUndefined();
			expect(mockUserIdGetter).toHaveBeenCalledOnce();
		});

		it("handles async userId getter that throws", async () => {
			const mockUserIdGetter = vi
				.fn()
				.mockRejectedValue(new Error("Failed to get user ID"));
			const identify = identifyStatsig(mockUserIdGetter);

			await expect(identify()).rejects.toThrow("Failed to get user ID");
			expect(mockUserIdGetter).toHaveBeenCalledOnce();
		});

		it("calls userId getter for each invocation when dedupe is mocked", async () => {
			const mockUserIdGetter = vi.fn().mockResolvedValue("test-user-456");
			const identify = identifyStatsig(mockUserIdGetter);

			const [result1, result2, result3] = await Promise.all([
				identify(),
				identify(),
				identify(),
			]);

			expect(result1).toEqual({ userID: "test-user-456" });
			expect(result2).toEqual({ userID: "test-user-456" });
			expect(result3).toEqual({ userID: "test-user-456" });

			expect(mockUserIdGetter).toHaveBeenCalledTimes(3);
		});
	});

	describe("identifyAnonymousUser", () => {
		it("returns anonymous user string", async () => {
			const result = await identifyAnonymousUser();

			expect(result).toBe("anonymous-user");
		});

		it("always returns the same anonymous user string", async () => {
			const result1 = await identifyAnonymousUser();
			const result2 = await identifyAnonymousUser();

			expect(result1).toBe("anonymous-user");
			expect(result2).toBe("anonymous-user");
		});
	});
});
