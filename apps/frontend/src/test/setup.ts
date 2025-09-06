import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("@/flags", () => ({
	chatEvalFlag: vi.fn(),
	createFeatureFlag: vi.fn(),
}));

vi.mock("@ai-sdk/rsc", () => ({
	readStreamableValue: vi.fn(),
	createStreamableValue: vi.fn(),
}));
