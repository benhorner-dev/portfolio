// Mock for @ai-sdk/rsc for Storybook
export const readStreamableValue = async function* (streamableValue) {
	// Mock implementation that yields a single empty response
	yield {
		answer: "Mock response for Storybook",
		graphMermaid: "",
		courseLinks: [],
		totalTokens: 0,
	};
};

export const createStreamableValue = (initialValue) => {
	// Mock implementation that returns a streamable value
	return {
		value: initialValue,
		update: () => {},
		done: () => {},
		append: () => {},
	};
};
