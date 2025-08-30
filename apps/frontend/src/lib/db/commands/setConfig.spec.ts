import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Database,
	DrizzleAgentConfig,
	DrizzleAgentConfigUpdate,
} from "@/lib/db/types";
import { setConfig, updateConfig, upsertConfig } from "./setConfig";

// Mock the database operations
const mockDb = {
	insert: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	update: vi.fn().mockReturnThis(),
	set: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	returning: vi.fn().mockResolvedValue([{ id: "test-config-1" }]),
	onConflictDoUpdate: vi.fn().mockReturnThis(),
} as unknown as Database;

describe("setConfig commands", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("setConfig", () => {
		it("should insert config and return its id", async () => {
			const configData: DrizzleAgentConfig = {
				id: "test-config-1",
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = await setConfig(configData, mockDb);

			expect(result).toBe("test-config-1");
			expect(mockDb.insert).toHaveBeenCalled();
			expect(
				(mockDb as unknown as { values: unknown }).values,
			).toHaveBeenCalledWith(configData);
		});
	});

	describe("updateConfig", () => {
		it("should update config and return its id", async () => {
			const updateData: DrizzleAgentConfigUpdate = {
				id: "test-config-1",
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.8 }),
			};

			const result = await updateConfig(updateData, mockDb);

			expect(result).toBe("test-config-1");
			expect(mockDb.update).toHaveBeenCalled();
		});

		it("should throw error if config not found", async () => {
			const mockDbNoResult = {
				...mockDb,
				returning: vi.fn().mockResolvedValue([]),
			} as unknown as Database;

			const updateData: DrizzleAgentConfigUpdate = {
				id: "non-existent-config",
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.8 }),
			};

			await expect(updateConfig(updateData, mockDbNoResult)).rejects.toThrow(
				"Config with ID non-existent-config not found",
			);
		});
	});

	describe("upsertConfig", () => {
		it("should upsert config and return its id", async () => {
			const configData: DrizzleAgentConfig = {
				id: "test-config-1",
				configDetails: JSON.stringify({ model: "gpt-4", temperature: 0.7 }),
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = await upsertConfig(configData, mockDb);

			expect(result).toBe("test-config-1");
			expect(mockDb.insert).toHaveBeenCalled();
			expect(
				(mockDb as unknown as { values: unknown }).values,
			).toHaveBeenCalled();
			expect(
				(mockDb as unknown as { onConflictDoUpdate: unknown })
					.onConflictDoUpdate,
			).toHaveBeenCalled();
		});
	});
});
