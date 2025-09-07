// Mock for @neondatabase/serverless for Storybook
export const neon = () => {
	// Mock implementation that returns a function that can be called
	return async () => {
		// Return empty result for Storybook
		return [];
	};
};

export default {
	neon,
};
