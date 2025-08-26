import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths(), react()],
	test: {
		exclude: ["node_modules/**", ".next/**", "tests/**", "**/*.spec.{ts,tsx}"],
		environment: "jsdom",
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
				"node_modules/**",
			],
		},
		clearMocks: true,
		passWithNoTests: true,
	},
});
