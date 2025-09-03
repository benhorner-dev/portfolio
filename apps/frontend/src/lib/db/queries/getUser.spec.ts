import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database, User } from "@/lib/db/types";
import { getUserByAuthId } from "./getUser";

const mockQuery = {
	users: {
		findFirst: vi.fn(),
	},
};

const mockDb = {
	query: mockQuery,
} as unknown as Database;

describe("getUser queries", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getUserByAuthId", () => {
		it("should return user when found by authId", async () => {
			const mockUser: User = {
				id: "user-uuid-123",
				email: "test@example.com",
				name: "Test User",
				tokens: 100,
				authId: "auth-123",
				createdAt: new Date("2024-01-01T00:00:00Z"),
				updatedAt: new Date("2024-01-01T00:00:00Z"),
			};

			mockQuery.users.findFirst.mockResolvedValue(mockUser);

			const result = await getUserByAuthId("auth-123", mockDb);

			expect(result).toEqual(mockUser);
			expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});

		it("should return undefined when user not found", async () => {
			mockQuery.users.findFirst.mockResolvedValue(undefined);

			const result = await getUserByAuthId("non-existent-auth-id", mockDb);

			expect(result).toBeUndefined();
			expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});

		it("should handle user with minimal fields", async () => {
			const mockUser: User = {
				id: "user-uuid-minimal",
				email: "minimal@example.com",
				name: null,
				tokens: 0,
				authId: "auth-minimal-123",
				createdAt: new Date("2024-01-01T00:00:00Z"),
				updatedAt: new Date("2024-01-01T00:00:00Z"),
			};

			mockQuery.users.findFirst.mockResolvedValue(mockUser);

			const result = await getUserByAuthId("auth-minimal-123", mockDb);

			expect(result).toEqual(mockUser);
			expect(result?.name).toBeNull();
			expect(result?.tokens).toBe(0);
		});

		it("should handle user with maximum tokens", async () => {
			const mockUser: User = {
				id: "user-uuid-max-tokens",
				email: "max@example.com",
				name: "Max Tokens User",
				tokens: 999999,
				authId: "auth-max-tokens-123",
				createdAt: new Date("2024-01-01T00:00:00Z"),
				updatedAt: new Date("2024-01-01T00:00:00Z"),
			};

			mockQuery.users.findFirst.mockResolvedValue(mockUser);

			const result = await getUserByAuthId("auth-max-tokens-123", mockDb);

			expect(result).toEqual(mockUser);
			expect(result?.tokens).toBe(999999);
		});

		it("should handle database error gracefully", async () => {
			const dbError = new Error("Database connection failed");
			mockQuery.users.findFirst.mockRejectedValue(dbError);

			await expect(getUserByAuthId("auth-error-123", mockDb)).rejects.toThrow(
				"Database connection failed",
			);
			expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});

		it("should handle empty authId string", async () => {
			mockQuery.users.findFirst.mockResolvedValue(undefined);

			const result = await getUserByAuthId("", mockDb);

			expect(result).toBeUndefined();
			expect(mockQuery.users.findFirst).toHaveBeenCalledWith({
				where: expect.any(Object),
			});
		});

		it("should handle special characters in authId", async () => {
			const mockUser: User = {
				id: "user-uuid-special",
				email: "special@example.com",
				name: "Special User",
				tokens: 50,
				authId: "auth-special-!@#$%^&*()",
				createdAt: new Date("2024-01-01T00:00:00Z"),
				updatedAt: new Date("2024-01-01T00:00:00Z"),
			};

			mockQuery.users.findFirst.mockResolvedValue(mockUser);

			const result = await getUserByAuthId("auth-special-!@#$%^&*()", mockDb);

			expect(result).toEqual(mockUser);
			expect(result?.authId).toBe("auth-special-!@#$%^&*()");
		});
	});
});
