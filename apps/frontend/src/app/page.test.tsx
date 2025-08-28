import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chatEvalFlag } from "@/flags";
import Home from "./page";

const mockChatEvalFlag = vi.mocked(chatEvalFlag);

describe("Home", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render 'Hello World' when flag is true", async () => {
		mockChatEvalFlag.mockResolvedValue(true);

		render(await Home());

		expect(screen.getByText("Hello World")).toBeInTheDocument();
		expect(mockChatEvalFlag).toHaveBeenCalledOnce();
	});

	it("should render 'Goodbye World' when flag is false", async () => {
		mockChatEvalFlag.mockResolvedValue(false);

		render(await Home());

		expect(screen.getByText("Goodbye World")).toBeInTheDocument();
		expect(mockChatEvalFlag).toHaveBeenCalledOnce();
	});
});
