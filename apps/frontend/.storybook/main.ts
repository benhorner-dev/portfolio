import type { StorybookConfig } from "@storybook/nextjs-vite";
import path, { dirname, join } from "path";

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
		options: {},
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

		return config;
	},
};
export default config;
