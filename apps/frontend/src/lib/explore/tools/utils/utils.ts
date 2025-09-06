import { AgentGraphError } from "@/lib/explore/errors";
import { getAgentConfig } from "@/lib/explore/getAgentConfig";

export function getNextItemInHierarchy<T>(
	currentStage: T,
	itemHierarchy: T[],
): T | null {
	const currentIndex = itemHierarchy.indexOf(currentStage);
	if (currentIndex === -1 || currentIndex === itemHierarchy.length - 1) {
		return null;
	}
	return itemHierarchy[currentIndex + 1];
}

export async function getToolConfig(toolName: string) {
	const config = await getAgentConfig(process.env.ALL_AGENT_CONFIG_PATH);

	const toolConfig = config.tools.find((tool) => tool.name === toolName);

	if (!toolConfig) {
		throw new AgentGraphError(
			`Error getting tool config for ${toolName}. Ensure that the tool is properyl configured in the allAgentConfig json`,
		);
	}

	return toolConfig;
}

export const addUniqueItems = (
	existing: string[],
	newItems?: string[],
): string[] => {
	if (!newItems) return existing;
	const uniqueNew = newItems.filter((item) => !existing.includes(item));
	return [...existing, ...uniqueNew];
};
