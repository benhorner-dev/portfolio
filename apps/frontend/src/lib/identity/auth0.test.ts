import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockUpsertUser = vi.fn();
const mockGetDb = vi.fn();
const mockLoggerError = vi.fn();

vi.doMock("@auth0/nextjs-auth0/server", () => ({
	Auth0Client: vi.fn().mockImplementation(() => ({
		getSession: mockGetSession,
	})),
}));

vi.doMock("../db/commands/upsertUser", () => ({
	upsertUser: mockUpsertUser,
}));

vi.doMock("../db/utils", () => ({
	getDb: mockGetDb,
}));

vi.doMock("../logger", () => ({
	getLogger: vi.fn(() => ({
		error: mockLoggerError,
		info: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
		fatal: vi.fn(),
		child: vi.fn(),
		level: "info",
	})),
}));

describe("auth0", () => {
	let getAuth0UserId: typeof import("./auth0").getAuth0UserId;

	beforeEach(async () => {
		vi.clearAllMocks();

		const auth0Module = await import("./auth0");
		getAuth0UserId = auth0Module.getAuth0UserId;

		vi.stubEnv("DATABASE_URL", "test_db_uri");
		vi.stubEnv("AUTH0_SCOPE", "openid profile email");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("getAuth0UserId", () => {
		it("returns user authId when session is valid and database operations succeed", async () => {
			const mockSession = {
				user: {
					sub: "auth0|123456789",
					email: "test@example.com",
					name: "Test User",
				},
			};

			const mockDb = { mock: "database" };
			const mockClose = vi.fn().mockResolvedValue(undefined);

			mockGetSession.mockResolvedValue(mockSession);
			mockGetDb.mockResolvedValue({
				db: mockDb,
				close: mockClose,
			});
			mockUpsertUser.mockResolvedValue({
				id: "1",
				authId: "auth0|123456789",
				email: "test@example.com",
				name: "Test User",
				tokens: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const result = await getAuth0UserId();

			expect(result).toBe("auth0|123456789");
			expect(mockGetSession).toHaveBeenCalledOnce();
			expect(mockGetDb).toHaveBeenCalledWith("test_db_uri");
			expect(mockUpsertUser).toHaveBeenCalledWith(
				{
					authId: "auth0|123456789",
					email: "test@example.com",
					name: "Test User",
				},
				mockDb,
			);
			expect(mockClose).toHaveBeenCalledOnce();
		});

		it("returns undefined when no session is available", async () => {
			mockGetSession.mockResolvedValue(null);

			const result = await getAuth0UserId();

			expect(result).toBeUndefined();
			expect(mockGetSession).toHaveBeenCalledOnce();
			expect(mockGetDb).not.toHaveBeenCalled();
			expect(mockUpsertUser).not.toHaveBeenCalled();
		});

		it("returns undefined when session is undefined", async () => {
			mockGetSession.mockResolvedValue(undefined);

			const result = await getAuth0UserId();

			expect(result).toBeUndefined();
			expect(mockGetSession).toHaveBeenCalledOnce();
			expect(mockGetDb).not.toHaveBeenCalled();
			expect(mockUpsertUser).not.toHaveBeenCalled();
		});

		it("returns undefined and logs error when session validation fails", async () => {
			const invalidSession = {
				user: {
					sub: "auth0|123456789",
					name: "Test User",
				},
			};

			mockGetSession.mockResolvedValue(invalidSession);

			const result = await getAuth0UserId();

			expect(result).toBeUndefined();
			expect(mockGetSession).toHaveBeenCalledOnce();
			expect(mockLoggerError).toHaveBeenCalledWith(
				"Invalid session",
				expect.any(Object),
			);
			expect(mockGetDb).not.toHaveBeenCalled();
			expect(mockUpsertUser).not.toHaveBeenCalled();
		});

		it("returns undefined and logs error when DATABASE_URL is not set", async () => {
			vi.unstubAllEnvs();
			vi.stubEnv("DATABASE_URL", undefined);

			const mockSession = {
				user: {
					sub: "auth0|123456789",
					email: "test@example.com",
					name: "Test User",
				},
			};

			mockGetSession.mockResolvedValue(mockSession);

			const result = await getAuth0UserId();

			expect(result).toBeUndefined();
			expect(mockGetSession).toHaveBeenCalledOnce();
			expect(mockLoggerError).toHaveBeenCalledWith("DATABASE_URL is not set");
			expect(mockGetDb).not.toHaveBeenCalled();
			expect(mockUpsertUser).not.toHaveBeenCalled();
		});

		it("returns undefined and logs error when DATABASE_URL is empty string", async () => {
			vi.unstubAllEnvs();
			vi.stubEnv("DATABASE_URL", "");

			const mockSession = {
				user: {
					sub: "auth0|123456789",
					email: "test@example.com",
					name: "Test User",
				},
			};

			mockGetSession.mockResolvedValue(mockSession);

			const result = await getAuth0UserId();

			expect(result).toBeUndefined();
			expect(mockGetSession).toHaveBeenCalledOnce();
			expect(mockLoggerError).toHaveBeenCalledWith("DATABASE_URL is not set");
			expect(mockGetDb).not.toHaveBeenCalled();
			expect(mockUpsertUser).not.toHaveBeenCalled();
		});

		it("handles upsertUser errors gracefully", async () => {
			const mockSession = {
				user: {
					sub: "auth0|123456789",
					email: "test@example.com",
					name: "Test User",
				},
			};

			const mockDb = { mock: "database" };
			const mockClose = vi.fn().mockResolvedValue(undefined);

			mockGetSession.mockResolvedValue(mockSession);
			mockGetDb.mockResolvedValue({
				db: mockDb,
				close: mockClose,
			});
			mockUpsertUser.mockRejectedValue(new Error("Failed to upsert user"));

			const result = await getAuth0UserId();

			expect(result).toBeUndefined();
			expect(mockGetSession).toHaveBeenCalledOnce();
			expect(mockGetDb).toHaveBeenCalledWith("test_db_uri");
			expect(mockUpsertUser).toHaveBeenCalledWith(
				{
					authId: "auth0|123456789",
					email: "test@example.com",
					name: "Test User",
				},
				mockDb,
			);
			expect(mockClose).toHaveBeenCalledOnce();
		});

		it("handles session with optional name field", async () => {
			const mockSession = {
				user: {
					sub: "auth0|123456789",
					email: "test@example.com",
					name: undefined,
				},
			};

			const mockDb = { mock: "database" };
			const mockClose = vi.fn().mockResolvedValue(undefined);

			mockGetSession.mockResolvedValue(mockSession);
			mockGetDb.mockResolvedValue({
				db: mockDb,
				close: mockClose,
			});
			mockUpsertUser.mockResolvedValue({
				id: "1",
				authId: "auth0|123456789",
				email: "test@example.com",
				name: null,
				tokens: 0,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const result = await getAuth0UserId();

			expect(result).toBe("auth0|123456789");
			expect(mockGetSession).toHaveBeenCalledOnce();
			expect(mockGetDb).toHaveBeenCalledWith("test_db_uri");
			expect(mockUpsertUser).toHaveBeenCalledWith(
				{
					authId: "auth0|123456789",
					email: "test@example.com",
					name: undefined,
				},
				mockDb,
			);
			expect(mockClose).toHaveBeenCalledOnce();
		});

		it("ensures database connection is closed even when upsertUser fails", async () => {
			const mockSession = {
				user: {
					sub: "auth0|123456789",
					email: "test@example.com",
					name: "Test User",
				},
			};

			const mockDb = { mock: "database" };
			const mockClose = vi.fn().mockResolvedValue(undefined);

			mockGetSession.mockResolvedValue(mockSession);
			mockGetDb.mockResolvedValue({
				db: mockDb,
				close: mockClose,
			});
			mockUpsertUser.mockRejectedValue(new Error("Database operation failed"));

			const result = await getAuth0UserId();

			expect(result).toBeUndefined();
			expect(mockClose).toHaveBeenCalledOnce();
		});
	});
});
