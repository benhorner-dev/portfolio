import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/commands/upsertUser", () => ({
	upsertUser: vi.fn(),
}));
vi.mock("@/lib/db/queries/getUser", () => ({
	getUserByAuthId: vi.fn(),
}));
vi.mock("@/lib/db/utils", () => ({
	getDb: vi.fn(),
}));

import { TOKEN_LIMIT } from "@/lib/constants";
import { upsertUser } from "@/lib/db/commands/upsertUser";
import { getUserByAuthId } from "@/lib/db/queries/getUser";
import type { User } from "@/lib/db/types";
import { getDb } from "@/lib/db/utils";
import { UserFacingErrors } from "@/lib/errors";
import { AgentGraphError } from "@/lib/explore/errors";
import { checkDailyTokenCount, updateTokenCount } from "./tokenCount";

const mockUpsertUser = vi.mocked(upsertUser);
const mockGetUserByAuthId = vi.mocked(getUserByAuthId);
const mockGetDb = vi.mocked(getDb);

const mockDb = { close: vi.fn() };
const mockClose = vi.fn();

describe("tokenCount", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetDb.mockResolvedValue({
			db: mockDb as never,
			close: mockClose,
		});
		process.env.TOKEN_LIMIT = "100";
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("checkDailyTokenCount", () => {
		it("throws error when DATABASE_URL is not set", async () => {
			const originalEnv = process.env.DATABASE_URL;
			delete process.env.DATABASE_URL;

			await expect(checkDailyTokenCount("user123")).rejects.toThrow(
				new AgentGraphError("DATABASE_URL is not set"),
			);

			process.env.DATABASE_URL = originalEnv;
		});

		it("throws error when user is not found", async () => {
			process.env.DATABASE_URL = "test-url";
			mockGetUserByAuthId.mockResolvedValue(undefined);

			await expect(checkDailyTokenCount("user123")).rejects.toThrow(
				new AgentGraphError(
					"User not found, only authenticated users can use the chat",
				),
			);

			expect(mockClose).toHaveBeenCalled();
		});

		it("returns user when tokens are below limit", async () => {
			process.env.DATABASE_URL = "test-url";
			const mockUser: User = {
				id: "1",
				name: null,
				email: "test@example.com",
				authId: "user123",
				tokens: 5,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockGetUserByAuthId.mockResolvedValue(mockUser);

			const result = await checkDailyTokenCount("user123");

			expect(result).toEqual(mockUser);
			expect(mockClose).toHaveBeenCalled();
		});

		it("resets tokens and returns user when last updated is not today", async () => {
			process.env.DATABASE_URL = "test-url";
			const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

			const mockUser: User = {
				id: "1",
				name: null,
				email: "test@example.com",
				authId: "user123",
				tokens: TOKEN_LIMIT + 10,
				createdAt: new Date(),
				updatedAt: yesterday,
			};
			const updatedMockUser = { ...mockUser, tokens: 0 };
			mockGetUserByAuthId.mockResolvedValue(mockUser);
			mockUpsertUser.mockResolvedValue(updatedMockUser);

			const result = await checkDailyTokenCount("user123");

			expect(mockUpsertUser).toHaveBeenCalledWith(
				{ ...mockUser, tokens: 0 },
				mockDb as never,
			);
			expect(result).toEqual(updatedMockUser);
			expect(mockClose).toHaveBeenCalled();
		});

		it("throws UserFacingErrors when token limit reached today", async () => {
			process.env.DATABASE_URL = "test-url";
			const today = new Date();
			const DAY_IN_MS = 24 * 60 * 60 * 1000;
			const oneDayAfterToday = new Date(today.getTime() + DAY_IN_MS);

			const mockUser: User = {
				id: "1",
				name: null,
				email: "test@example.com",
				authId: "user123",
				tokens: TOKEN_LIMIT + 10,
				createdAt: new Date(),
				updatedAt: today,
			};
			mockGetUserByAuthId.mockResolvedValue(mockUser);

			await expect(checkDailyTokenCount("user123")).rejects.toThrow(
				new UserFacingErrors(
					`You have reached the token limit for today: ${mockUser.tokens}, please try again on ${oneDayAfterToday.toLocaleDateString()} at ${oneDayAfterToday.toLocaleTimeString()}`,
				),
			);

			expect(mockClose).toHaveBeenCalled();
		});

		it("ensures close is called even when error occurs", async () => {
			process.env.DATABASE_URL = "test-url";
			mockGetUserByAuthId.mockRejectedValue(new Error("Database error"));

			await expect(checkDailyTokenCount("user123")).rejects.toThrow(
				"Database error",
			);
			expect(mockClose).toHaveBeenCalled();
		});
	});

	describe("updateTokenCount", () => {
		it("throws error when DATABASE_URL is not set", async () => {
			const originalEnv = process.env.DATABASE_URL;
			delete process.env.DATABASE_URL;

			const mockUser: User = {
				id: "1",
				name: null,
				email: "test@example.com",
				authId: "user123",
				tokens: 10,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await expect(updateTokenCount(mockUser, 5)).rejects.toThrow(
				new AgentGraphError("DATABASE_URL is not set"),
			);

			process.env.DATABASE_URL = originalEnv;
		});

		it("updates user token count successfully", async () => {
			process.env.DATABASE_URL = "test-url";
			const mockUser: User = {
				id: "1",
				name: null,
				email: "test@example.com",
				authId: "user123",
				tokens: 10,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const updatedUser = { ...mockUser, tokens: 15 };
			mockUpsertUser.mockResolvedValue(updatedUser);

			const result = await updateTokenCount(mockUser, 5);

			expect(mockUpsertUser).toHaveBeenCalledWith(
				{ ...mockUser, tokens: 15 },
				mockDb as never,
			);
			expect(result).toEqual(updatedUser);
			expect(mockClose).toHaveBeenCalled();
		});

		it("ensures close is called even when error occurs", async () => {
			process.env.DATABASE_URL = "test-url";
			const mockUser: User = {
				id: "1",
				name: null,
				email: "test@example.com",
				authId: "user123",
				tokens: 10,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockUpsertUser.mockRejectedValue(new Error("Database error"));

			await expect(updateTokenCount(mockUser, 5)).rejects.toThrow(
				"Database error",
			);
			expect(mockClose).toHaveBeenCalled();
		});
	});
});
