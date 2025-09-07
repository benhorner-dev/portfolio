// Mock for @langchain/langgraph in Storybook
export const StateGraph = () => {
	throw new Error("StateGraph should not be called in Storybook");
};

export const END = "END";
export const START = "START";

export default {
	StateGraph,
	END,
	START,
};
