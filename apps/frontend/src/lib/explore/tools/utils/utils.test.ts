import { beforeEach, describe, expect, it, vi } from "vitest";
import { addUniqueItems, getNextItemInHierarchy } from "./utils";

vi.mock("@/lib/logger", () => ({
	getLogger: vi.fn(() => ({
		error: vi.fn(),
		info: vi.fn(),
	})),
}));

const mockCache = {
	get: vi.fn(),
};

vi.mock("@/lib/explore/cache", () => ({
	getCache: vi.fn(() => Promise.resolve(mockCache)),
}));

describe("getNextStage", () => {
	enum TestEnum {
		STAGE1,
		STAGE2,
		STAGE3,
	}
	const testHierarchy = [TestEnum.STAGE1, TestEnum.STAGE2, TestEnum.STAGE3];

	it("should return next stage in hierarchy", () => {
		expect(getNextItemInHierarchy(TestEnum.STAGE1, testHierarchy)).toBe(
			TestEnum.STAGE2,
		);
		expect(getNextItemInHierarchy(TestEnum.STAGE2, testHierarchy)).toBe(
			TestEnum.STAGE3,
		);
	});

	it("should return null for last stage", () => {
		expect(getNextItemInHierarchy(TestEnum.STAGE3, testHierarchy)).toBe(null);
	});

	it("should return null for stage not in hierarchy", () => {
		expect(
			getNextItemInHierarchy(
				"INVALID_STAGE" as unknown as TestEnum,
				testHierarchy,
			),
		).toBe(null);
	});

	it("should work with custom hierarchy", () => {
		const customHierarchy = [TestEnum.STAGE1, TestEnum.STAGE2];
		expect(getNextItemInHierarchy(TestEnum.STAGE1, customHierarchy)).toBe(
			TestEnum.STAGE2,
		);
		expect(getNextItemInHierarchy(TestEnum.STAGE2, customHierarchy)).toBe(null);
		expect(getNextItemInHierarchy(TestEnum.STAGE2, customHierarchy)).toBe(null);
	});

	it("should handle empty hierarchy", () => {
		expect(getNextItemInHierarchy(TestEnum.STAGE1, [])).toBe(null);
	});

	it("should handle single item hierarchy", () => {
		const singleHierarchy = [TestEnum.STAGE1];
		expect(getNextItemInHierarchy(TestEnum.STAGE1, singleHierarchy)).toBe(null);
		expect(getNextItemInHierarchy(TestEnum.STAGE2, singleHierarchy)).toBe(null);
	});
});

describe("getToolConfig", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const importModule = async () => {
		vi.resetModules();
		return await import("./utils");
	};

	it("should throw AgentGraphError when tool config is not found", async () => {
		const mockConfig = {
			tools: [{ name: "existingTool", config: {} }],
		};

		vi.doMock("@/lib/explore/getAgentConfig", () => ({
			getAgentConfig: vi.fn().mockResolvedValue(mockConfig),
		}));

		const { getToolConfig } = await importModule();

		await expect(getToolConfig("nonExistentTool")).rejects.toThrow(
			"Error getting tool config for nonExistentTool. Ensure that the tool is properyl configured in the allAgentConfig json",
		);
	});
});

describe("addUniqueItems", () => {
	it("should add unique items to existing array", () => {
		const existing = ["item1", "item2"];
		const newItems = ["item3", "item4"];
		const result = addUniqueItems(existing, newItems);

		expect(result).toEqual(["item1", "item2", "item3", "item4"]);
	});

	it("should not add duplicate items", () => {
		const existing = ["item1", "item2"];
		const newItems = ["item2", "item3"];
		const result = addUniqueItems(existing, newItems);

		expect(result).toEqual(["item1", "item2", "item3"]);
	});

	it("should return existing array when newItems is undefined", () => {
		const existing = ["item1", "item2"];
		const result = addUniqueItems(existing, undefined);

		expect(result).toEqual(["item1", "item2"]);
	});

	it("should return existing array when newItems is empty", () => {
		const existing = ["item1", "item2"];
		const result = addUniqueItems(existing, []);

		expect(result).toEqual(["item1", "item2"]);
	});

	it("should handle empty existing array", () => {
		const existing: string[] = [];
		const newItems = ["item1", "item2"];
		const result = addUniqueItems(existing, newItems);

		expect(result).toEqual(["item1", "item2"]);
	});

	it("should handle all duplicate items", () => {
		const existing = ["item1", "item2"];
		const newItems = ["item1", "item2"];
		const result = addUniqueItems(existing, newItems);

		expect(result).toEqual(["item1", "item2"]);
	});
});
