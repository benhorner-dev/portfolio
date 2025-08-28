import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database, DrizzleHumanEvaluationUpdateAll } from "../types";

import { setHumanEval } from "./setHumanEval";

// Mock the database operations
const mockTransaction = vi.fn();
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockResolvedValue([{ count: 0 }]);
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn().mockReturnThis();
const mockReturning = vi.fn().mockResolvedValue([{ id: "eval-id-123" }]);

const mockDb = {
	transaction: mockTransaction.mockImplementation((callback) => {
		const tx = {
			select: mockSelect,
			from: mockFrom,
			where: mockWhere,
			insert: mockInsert,
			values: mockValues,
			returning: mockReturning,
		};
		return callback(tx);
	}),
} as unknown as Database;

describe("setHumanEval commands", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("setHumanEval", () => {
		it("should insert human evaluation with incremented evaluation set", async () => {
			const evaluationData: DrizzleHumanEvaluationUpdateAll = {
				configId: "test-config-1",
				evaluatorId: "evaluator-123",
				recommendationQuality: 4,
				explanationClarity: 5,
				relevanceToProfile: 3,
				courseVariety: 4,
				trustworthiness: 5,
				overallSatisfaction: 4,
			};

			const result = await setHumanEval(evaluationData, mockDb);

			expect(result).toBe("eval-id-123");
			expect(mockTransaction).toHaveBeenCalled();
			expect(mockSelect).toHaveBeenCalled();
			expect(mockInsert).toHaveBeenCalled();
			expect(mockValues).toHaveBeenCalledWith({
				...evaluationData,
				evaluationSet: 1, // 0 + 1
			});
			expect(mockReturning).toHaveBeenCalled();
		});

		it("should handle existing evaluations and increment evaluation set", async () => {
			// Mock existing evaluation count
			const mockWhereWithCount = vi.fn().mockResolvedValue([{ count: 1 }]);

			const mockDbWithExisting = {
				transaction: mockTransaction.mockImplementation((callback) => {
					const tx = {
						select: mockSelect,
						from: mockFrom,
						where: mockWhereWithCount,
						insert: mockInsert,
						values: mockValues,
						returning: mockReturning,
					};
					return callback(tx);
				}),
			} as unknown as Database;

			const evaluationData: DrizzleHumanEvaluationUpdateAll = {
				configId: "test-config-1",
				evaluatorId: "evaluator-456",
				recommendationQuality: 3,
				explanationClarity: 4,
				relevanceToProfile: 2,
				courseVariety: 3,
				trustworthiness: 4,
				overallSatisfaction: 3,
			};

			const result = await setHumanEval(evaluationData, mockDbWithExisting);

			expect(result).toBe("eval-id-123");
			expect(mockValues).toHaveBeenCalledWith({
				...evaluationData,
				evaluationSet: 2, // 1 + 1
			});
		});
	});
});
