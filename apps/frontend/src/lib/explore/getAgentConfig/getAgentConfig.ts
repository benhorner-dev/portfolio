import { unstable_cache } from "next/cache";
import { configLoader } from "@/lib/configLoader";
import { configParser } from "@/lib/configParser";
import { AgentConfigSchema } from "@/lib/explore/schema";
import { AgentGraphError } from "../errors";
import type { AgentConfig } from "../types";

const startupTime = Date.now().toString();

const getCachedAgentConfig = unstable_cache(
	async (configPath: string | undefined): Promise<AgentConfig> => {
		if (!configPath) {
			throw new Error(
				"an agent config path environment variable is not set. This needs to be set to the path of the agent config file.",
			);
		}
		const rawConfig = configLoader(configPath, (error) => {
			throw new AgentGraphError(`Failed to load agent config: ${error}`);
		});
		const parsedConfig = configParser(AgentConfigSchema, rawConfig, (error) => {
			throw new AgentGraphError(`Failed to parse agent config: ${error}`);
		});
		return parsedConfig;
	},
	["agent-config", startupTime],
	{
		revalidate: 3600,
		tags: ["agent-config"],
	},
);

export async function getAgentConfig(
	configPath: string | undefined,
): Promise<AgentConfig> {
	return getCachedAgentConfig(configPath);
}
