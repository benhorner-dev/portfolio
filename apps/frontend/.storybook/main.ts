import path, { dirname, join } from "node:path";
import type { StorybookConfig } from "@storybook/nextjs-vite";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
	return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		getAbsolutePath("@chromatic-com/storybook"),
		getAbsolutePath("@storybook/addon-docs"),
		getAbsolutePath("@storybook/addon-onboarding"),
		getAbsolutePath("@storybook/addon-a11y"),
		getAbsolutePath("@storybook/addon-vitest"),
	],
	framework: {
		name: getAbsolutePath("@storybook/nextjs-vite"),
		options: {
			nextConfigPath: path.resolve(__dirname, "../next.config.js"),
		},
	},
	viteFinal: async (config) => {
		// Use a unique cache directory to prevent conflicts with other Vite instances
		// This is especially important in CI environments where multiple Vite processes run
		config.cacheDir = path.join(
			__dirname,
			"../node_modules/.cache/storybook-vite",
		);

		// Ensure proper module resolution in CI environments
		config.optimizeDeps = {
			...config.optimizeDeps,
			include: ["react", "react-dom", "axe-core"],
		};

		// Mock Next.js components for Storybook compatibility
		config.define = {
			...config.define,
			"process.env.NODE_ENV": JSON.stringify("development"),
		};

		config.resolve = {
			...config.resolve,
			alias: {
				...config.resolve?.alias,
				"next/image": path.resolve(__dirname, "./mock-image.tsx"),
				"next/link": path.resolve(__dirname, "./mock-link.tsx"),
			},
		};

		return config;
	},
};
export default config;
