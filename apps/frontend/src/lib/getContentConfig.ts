import { unstable_cache } from "next/cache";
import { configLoader } from "@/lib/configLoader";
import { configParser } from "@/lib/configParser";
import {
	ContentConfigError,
	ContentConfigLoadError,
	ContentConfigParseError,
} from "@/lib/errors";
import type { ContentConfig } from "@/lib/schema";
import { ContentConfigSchema } from "@/lib/schema";

export const getContentConfig = unstable_cache(
	async (): Promise<ContentConfig> => {
		const configPath = process.env.CONTENT_CONFIG_PATH;

		if (!configPath) {
			throw new ContentConfigError("CONTENT_CONFIG_PATH is not set");
		}

		const rawConfig = configLoader(configPath, (error) => {
			throw new ContentConfigLoadError(
				`Failed to load config from ${configPath}`,
				error as Error,
			);
		});

		const contentConfig = configParser(
			ContentConfigSchema,
			rawConfig,
			(error) => {
				throw new ContentConfigParseError(
					"Failed to parse content config",
					error as Error,
				);
			},
		);

		return contentConfig;
	},
	["content-config"],
	{
		revalidate: 1,
		tags: ["content-config"],
	},
);
