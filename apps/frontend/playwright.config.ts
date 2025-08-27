import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
		trace: "on-first-retry",
		extraHTTPHeaders: process.env.PLAYWRIGHT_VERCEL_TOKEN
			? {
					"x-vercel-protection-bypass": process.env.PLAYWRIGHT_VERCEL_TOKEN,
				}
			: {},
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},

		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},

		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},

		{
			name: "Mobile Chrome",
			use: { ...devices["Pixel 5"] },
		},
		{
			name: "Mobile Safari",
			use: { ...devices["iPhone 12"] },
		},

		{
			name: "Microsoft Edge",
			use: { ...devices["Desktop Edge"], channel: "msedge" },
		},
		{
			name: "Google Chrome",
			use: { ...devices["Desktop Chrome"], channel: "chrome" },
		},
	],
});
