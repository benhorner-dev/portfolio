import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths(), react()],
	test: {
		exclude: ["tests/**", "node_modules/**", ".next/**"],
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		coverage: {
			enabled: true,
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			reportsDirectory: "coverage",
			include: ["src/**/*"],
			exclude: [
				"src/**/*.{test,spec}.{js,ts,jsx,tsx}",
				"src/**/__tests__/**",
				"src/test/**",
			],
			thresholds: {
				lines: 100,
				functions: 100,
				branches: 100,
				statements: 100,
			},
			reportOnFailure: true,
		},
		clearMocks: true,
		passWithNoTests: true,
	},
});
