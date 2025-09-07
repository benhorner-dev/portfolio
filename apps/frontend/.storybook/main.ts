import type { StorybookConfig } from "@storybook/nextjs-vite";

import { dirname, join } from "path";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
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
	viteFinal: async (config, { configType }) => {
		// Configure Vite for Storybook
		config.define = {
			...config.define,
			global: "globalThis",
		};

		// Configure for Next.js canary compatibility
		// Check if we're actually building Storybook vs running tests
		if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
			// Minimal externalization for Next.js canary - let Vite handle most modules
			config.build = {
				...config.build,
				rollupOptions: {
					...config.build?.rollupOptions,
					external: [
						...((config.build?.rollupOptions?.external as string[]) || []),
						// Only externalize core Node.js modules that absolutely can't work in browsers
						"node:fs",
						"node:crypto",
						"node:net",
						"node:tls",
						"node:async_hooks",
						"node:perf_hooks",
						"node:os",
						"fs",
						"crypto",
						"net",
						"tls",
						"os",
						"async_hooks",
						"perf_hooks",
					],
				},
			};

			// Provide fallbacks for externalized modules and mock @ai-sdk/rsc
			config.resolve = {
				...config.resolve,
				alias: {
					...config.resolve?.alias,
					"@ai-sdk/rsc": require.resolve("./mocks/ai-sdk-rsc.js"),
					"node:fs": "false",
					"node:async_hooks": require.resolve("./mocks/async-local-storage.js"),
					"node:perf_hooks": require.resolve("./mocks/perf-hooks.js"),
					"node:os": require.resolve("./mocks/os.js"),
					async_hooks: require.resolve("./mocks/async-local-storage.js"),
					perf_hooks: require.resolve("./mocks/perf-hooks.js"),
					os: require.resolve("./mocks/os.js"),
				},
			};
		}

		return config;
	},
};
export default config;
