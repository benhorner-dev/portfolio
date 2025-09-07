// Mock for the entire agent module in Storybook
export const agent = () => {
	throw new Error("Agent should not be called in Storybook");
};

export const createAgentOrchestrator = () => {
	throw new Error("createAgentOrchestrator should not be called in Storybook");
};

export const checkDailyTokenCount = () => {
	throw new Error("checkDailyTokenCount should not be called in Storybook");
};

export const updateTokenCount = () => {
	throw new Error("updateTokenCount should not be called in Storybook");
};

export default {
	agent,
	createAgentOrchestrator,
	checkDailyTokenCount,
	updateTokenCount,
};
