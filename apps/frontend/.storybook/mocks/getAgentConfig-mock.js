// Mock for getAgentConfig in Storybook
export const getAgentConfig = () => {
	throw new Error("getAgentConfig should not be called in Storybook");
};

export default {
	getAgentConfig,
};
