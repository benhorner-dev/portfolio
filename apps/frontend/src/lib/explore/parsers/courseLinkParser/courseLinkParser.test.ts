import { beforeEach, describe, expect, it, vi } from "vitest";
import { courseLinkParser } from "./courseLinkParser";

const mockLogger = {
	warn: vi.fn(),
};

vi.mock("@/lib/logger", () => ({
	getLogger: vi.fn(() => mockLogger),
}));

describe("courseLinkParser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	it("returns courseLinks array from direct object with courseLinks", () => {
		const result = {
			courseLinks: [
				"https://example.com/course1",
				"https://example.com/course2",
			],
		};

		const parsed = courseLinkParser(result);

		expect(parsed).toEqual([
			"https://example.com/course1",
			"https://example.com/course2",
		]);
	});

	it("returns courseLinks array from JSON string with courseLinks", () => {
		const result = JSON.stringify({
			courseLinks: ["https://example.com/course1"],
		});

		const parsed = courseLinkParser(result);

		expect(parsed).toEqual(["https://example.com/course1"]);
	});

	it("returns courseLinks from toolResults.final_answer string", () => {
		const result = {
			toolResults: {
				final_answer: JSON.stringify({
					courseLinks: ["https://example.com/course3"],
				}),
			},
		};

		const parsed = courseLinkParser(result);

		expect(parsed).toEqual(["https://example.com/course3"]);
	});

	it("returns courseLinks from toolResults.final_answer object", () => {
		const result = {
			toolResults: {
				final_answer: {
					courseLinks: ["https://example.com/course4"],
				},
			},
		};

		const parsed = courseLinkParser(result);

		expect(parsed).toEqual(["https://example.com/course4"]);
	});

	it("returns empty array when courseLinks is not an array", () => {
		const result = {
			courseLinks: "not-an-array",
		};

		const parsed = courseLinkParser(result);

		expect(parsed).toEqual([]);
	});

	it("returns empty array when courseLinks array contains non-strings", () => {
		const result = {
			courseLinks: [123, 456],
		};

		const parsed = courseLinkParser(result);

		expect(parsed).toEqual([]);
	});

	it("returns empty array when no courseLinks found", () => {
		const result = {
			someOtherProperty: "value",
		};

		const parsed = courseLinkParser(result);

		expect(parsed).toEqual([]);
	});

	it("returns empty array and logs warning on JSON parse error", () => {
		const result = "invalid-json";

		const parsed = courseLinkParser(result);

		expect(parsed).toEqual([]);
		expect(mockLogger.warn).toHaveBeenCalled();
	});

	it("handles toolResults.final_answer with invalid JSON string", () => {
		const result = {
			toolResults: {
				final_answer: "invalid-json",
			},
		};

		const parsed = courseLinkParser(result);

		expect(parsed).toEqual([]);
		expect(mockLogger.warn).toHaveBeenCalled();
	});

	it("returns empty array when toolResults.final_answer object has no courseLinks", () => {
		const result = {
			toolResults: {
				final_answer: {
					answer: "some answer",
				},
			},
		};

		const parsed = courseLinkParser(result);

		expect(parsed).toEqual([]);
	});

	it("returns empty array when toolResults.final_answer string has no courseLinks", () => {
		const result = {
			toolResults: {
				final_answer: JSON.stringify({
					answer: "some answer",
				}),
			},
		};

		const parsed = courseLinkParser(result);

		expect(parsed).toEqual([]);
	});
});
