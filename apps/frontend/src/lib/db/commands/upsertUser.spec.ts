import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database, NewUser, User } from "@/lib/db/types";
import { upsertUser } from "./upsertUser";

const mockValues = vi.fn().mockReturnThis();
const mockOnConflictDoUpdate = vi.fn().mockReturnThis();
const mockReturning = vi.fn().mockReturnThis();

const mockDb = {
	insert: vi.fn().mockReturnValue({
		values: mockValues,
		onConflictDoUpdate: mockOnConflictDoUpdate,
		returning: mockReturning,
	}),
} as unknown as Database;

describe("upsertUser command", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should upsert user and return the user object", async () => {
		const userData: NewUser = {
			email: "test@example.com",
			name: "Test User",
			tokens: 100,
			authId: "auth-123",
		};

		const expectedUser: User = {
			id: "user-uuid-123",
			email: "test@example.com",
			name: "Test User",
			tokens: 100,
			authId: "auth-123",
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: new Date("2024-01-01T00:00:00Z"),
		};

		mockReturning.mockResolvedValue([expectedUser]);

		const result = await upsertUser(userData, mockDb);

		expect(result).toEqual(expectedUser);
		expect(mockDb.insert).toHaveBeenCalled();
		expect(mockValues).toHaveBeenCalledWith(userData);
		expect(mockOnConflictDoUpdate).toHaveBeenCalled();
		expect(mockReturning).toHaveBeenCalled();
	});

	it("should handle user with minimal required fields", async () => {
		const userData: NewUser = {
			email: "minimal@example.com",
			authId: "auth-minimal-123",
		};

		const expectedUser: User = {
			id: "user-uuid-minimal",
			email: "minimal@example.com",
			name: null,
			tokens: 0,
			authId: "auth-minimal-123",
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: new Date("2024-01-01T00:00:00Z"),
		};

		mockReturning.mockResolvedValue([expectedUser]);

		const result = await upsertUser(userData, mockDb);

		expect(result).toEqual(expectedUser);
		expect(mockDb.insert).toHaveBeenCalled();
		expect(mockValues).toHaveBeenCalledWith(userData);
	});

	it("should handle user update scenario", async () => {
		const userData: NewUser = {
			email: "updated@example.com",
			name: "Updated User",
			tokens: 200,
			authId: "auth-existing-123",
		};

		const updatedUser: User = {
			id: "user-uuid-existing",
			email: "updated@example.com",
			name: "Updated User",
			tokens: 200,
			authId: "auth-existing-123",
			createdAt: new Date("2024-01-01T00:00:00Z"),
			updatedAt: new Date("2024-01-02T00:00:00Z"),
		};

		mockReturning.mockResolvedValue([updatedUser]);

		const result = await upsertUser(userData, mockDb);

		expect(result).toEqual(updatedUser);
		expect(mockDb.insert).toHaveBeenCalled();
		expect(mockValues).toHaveBeenCalledWith(userData);
		expect(mockOnConflictDoUpdate).toHaveBeenCalled();
	});
});
