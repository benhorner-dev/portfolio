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

		// Only externalize modules when building Storybook (not during tests)
		// Check if we're actually building Storybook vs running tests
		if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
			// Externalize Node.js modules and server-side packages
			config.build = {
				...config.build,
				rollupOptions: {
					...config.build?.rollupOptions,
					external: [
						...(config.build?.rollupOptions?.external || []),
						"@langchain/langgraph",
						"node:async_hooks",
						"node:fs",
						"node:crypto",
						"node:events",
						"node:net",
						"node:tls",
						"node:url",
						"node:timers/promises",
						"async_hooks",
						"fs",
						"crypto",
						"events",
						"net",
						"tls",
						"url",
						"timers",
						"stream",
						"os",
						"perf_hooks",
						"redis",
						"postgres",
						"neo4j-driver",
						"chromadb",
						"@neondatabase/serverless",
						"@vercel/kv",
						"@pinecone-database/pinecone",
					],
				},
			};

			// Provide fallbacks for externalized modules and mock @ai-sdk/rsc
			config.resolve = {
				...config.resolve,
				alias: {
					...config.resolve?.alias,
					"@langchain/langgraph": false,
					"@ai-sdk/rsc": require.resolve("./mocks/ai-sdk-rsc.js"),
					"node:async_hooks": false,
					"node:fs": false,
					redis: false,
					postgres: false,
					"neo4j-driver": false,
					chromadb: false,
					"@neondatabase/serverless": false,
					"@vercel/kv": false,
					"@pinecone-database/pinecone": false,
				},
			};
		}

		return config;
	},
};
export default config;
