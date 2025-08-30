import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

const mockUseEffect = vi.fn();
vi.mock("react", async () => {
	const actual = await vi.importActual("react");
	return {
		...actual,
		useEffect: mockUseEffect,
	};
});

const mockCaptureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
	captureException: mockCaptureException,
}));

vi.mock("next/error", () => ({
	default: ({ statusCode }: { statusCode: number }) => (
		<div data-testid="next-error">NextError with status: {statusCode}</div>
	),
}));

it("GlobalError captures error in Sentry and renders NextError", async () => {
	const { default: GlobalError } = await import("./global-error");

	const testError = new Error("Test error message");

	render(<GlobalError error={testError} />);

	expect(mockUseEffect).toHaveBeenCalled();

	const effectCall = mockUseEffect.mock.calls[0];
	if (effectCall?.[0]) {
		effectCall[0]();
	}

	expect(mockCaptureException).toHaveBeenCalledWith(testError);
	expect(screen.getByTestId("next-error")).toBeInTheDocument();
	expect(screen.getByText("NextError with status: 0")).toBeInTheDocument();
});
