import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "@/lib/errorBoundary";

expect.extend(matchers);

interface ThrowErrorProps {
	shouldThrow?: boolean;
	errorMessage?: string;
}

const ThrowError: React.FC<ThrowErrorProps> = ({
	shouldThrow = false,
	errorMessage = "Test error",
}) => {
	if (shouldThrow) {
		throw new Error(errorMessage);
	}
	return <div>No error occurred</div>;
};

const TestFallback: React.ComponentType<{ error?: Error }> = ({ error }) => (
	<div>
		<h2>Something went wrong</h2>
		<p>Error: {error?.message}</p>
	</div>
);

describe("ErrorBoundary", () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
		cleanup();
	});

	it("renders children when there is no error", () => {
		render(
			<ErrorBoundary fallback={TestFallback}>
				<ThrowError shouldThrow={false} />
			</ErrorBoundary>,
		);

		expect(screen.getByText("No error occurred")).toBeInTheDocument();
	});

	it("renders fallback component when child throws error", () => {
		render(
			<ErrorBoundary fallback={TestFallback}>
				<ThrowError shouldThrow={true} errorMessage="Custom test error" />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(screen.getByText("Error: Custom test error")).toBeInTheDocument();
		expect(screen.queryByText("No error occurred")).not.toBeInTheDocument();
	});

	it("calls onError callback when error occurs", () => {
		const onError = vi.fn();

		render(
			<ErrorBoundary fallback={TestFallback} onError={onError}>
				<ThrowError shouldThrow={true} errorMessage="Test callback error" />
			</ErrorBoundary>,
		);

		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Test callback error",
			}),
			expect.objectContaining({
				componentStack: expect.any(String),
			}),
		);
	});

	it("does not call onError when no error occurs", () => {
		const onError = vi.fn();

		render(
			<ErrorBoundary fallback={TestFallback} onError={onError}>
				<ThrowError shouldThrow={false} />
			</ErrorBoundary>,
		);

		expect(onError).not.toHaveBeenCalled();
	});

	it("continues to render fallback after error is caught", () => {
		const { rerender } = render(
			<ErrorBoundary fallback={TestFallback}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();

		rerender(
			<ErrorBoundary fallback={TestFallback}>
				<ThrowError shouldThrow={false} />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
	});

	it("catches errors from nested components", () => {
		const NestedComponent: React.FC = () => (
			<div>
				<ThrowError shouldThrow={true} errorMessage="Nested error" />
			</div>
		);

		render(
			<ErrorBoundary fallback={TestFallback}>
				<NestedComponent />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(screen.getByText("Error: Nested error")).toBeInTheDocument();
	});

	it("handles multiple children with one throwing error", () => {
		render(
			<ErrorBoundary fallback={TestFallback}>
				<div>First child</div>
				<ThrowError shouldThrow={true} errorMessage="Second child error" />
				<div>Third child</div>
			</ErrorBoundary>,
		);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(screen.getByText("Error: Second child error")).toBeInTheDocument();
		expect(screen.queryByText("First child")).not.toBeInTheDocument();
		expect(screen.queryByText("Third child")).not.toBeInTheDocument();
	});

	it("passes error object to fallback component", () => {
		const FallbackWithErrorDetails: React.ComponentType<{ error?: Error }> = ({
			error,
		}) => (
			<div>
				<h2>Error caught</h2>
				<p data-testid="error-name">{error?.name}</p>
				<p data-testid="error-message">{error?.message}</p>
				<p data-testid="error-stack">{error?.stack?.substring(0, 20)}...</p>
			</div>
		);

		render(
			<ErrorBoundary fallback={FallbackWithErrorDetails}>
				<ThrowError shouldThrow={true} errorMessage="Detailed error test" />
			</ErrorBoundary>,
		);

		expect(screen.getByTestId("error-name")).toHaveTextContent("Error");
		expect(screen.getByTestId("error-message")).toHaveTextContent(
			"Detailed error test",
		);
		expect(screen.getByTestId("error-stack")).toHaveTextContent(
			"Error: Detailed erro..",
		);
	});

	describe("edge cases", () => {
		it("handles error thrown in render method", () => {
			const BadComponent: React.FC = () => {
				throw new Error("Render error");
			};

			render(
				<ErrorBoundary fallback={TestFallback}>
					<BadComponent />
				</ErrorBoundary>,
			);

			expect(screen.getByText("Something went wrong")).toBeInTheDocument();
			expect(screen.getByText("Error: Render error")).toBeInTheDocument();
		});

		it("handles error with no message", async () => {
			const ComponentThrowingEmptyError: React.FC = () => {
				throw new Error();
			};

			render(
				<ErrorBoundary fallback={TestFallback}>
					<ComponentThrowingEmptyError />
				</ErrorBoundary>,
			);

			await waitFor(() => {
				expect(screen.getByText("Something went wrong")).toBeInTheDocument();
			});
			expect(screen.getByText("Error:")).toBeInTheDocument();
		});

		it("handles non-Error objects thrown", () => {
			const ComponentThrowingString: React.FC = () => {
				throw "String error";
			};

			render(
				<ErrorBoundary fallback={TestFallback}>
					<ComponentThrowingString />
				</ErrorBoundary>,
			);

			expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		});
	});
});

describe("ErrorBoundary Integration", () => {
	it("should be used with organism components", () => {
		// Mock organism component
		const ProductCard: React.FC<{ shouldFail?: boolean }> = ({
			shouldFail,
		}) => {
			if (shouldFail) throw new Error("Product load failed");
			return <div>Product loaded successfully</div>;
		};

		const ProductCardError: React.ComponentType<{ error?: Error }> = () => (
			<div className="product-error">
				<p>Unable to load product</p>
				<button type="button">Retry</button>
			</div>
		);

		render(
			<ErrorBoundary fallback={ProductCardError}>
				<ProductCard shouldFail={true} />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Unable to load product")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
	});
});
