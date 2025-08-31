import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("@/flags", () => ({
	chatEvalFlag: vi.fn(),
	createFeatureFlag: vi.fn(),
}));
