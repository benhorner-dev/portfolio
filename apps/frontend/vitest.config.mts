/// <reference types="vitest/config" />

import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const dirname =
	typeof __dirname !== "undefined"
		? __dirname
		: path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
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
				"src/**/*.stories.{js,ts,jsx,tsx}",
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
		projects: [
			{
				extends: true,
				test: {
					name: "all",
					include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
					exclude: ["src/stories/**"],
				},
			},
			{
				extends: true,
				plugins: [
					storybookTest({
						configDir: path.join(dirname, ".storybook"),
					}),
				],
				test: {
					name: "storybook",
					browser: {
						enabled: true,
						headless: true,
						provider: "playwright",
						instances: [
							{
								browser: "chromium",
							},
						],
					},
					setupFiles: [".storybook/vitest.setup.ts"],
				},
			},
		],
	},
});
