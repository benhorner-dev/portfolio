// Mock for configLoader in Storybook
export const configLoader = () => {
	throw new Error("configLoader should not be called in Storybook");
};

export default {
	configLoader,
};
