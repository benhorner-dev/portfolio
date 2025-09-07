// Mock for perf_hooks in browser environment
export const performance = {
	now: () => Date.now(),
	mark: () => {},
	measure: () => {},
	getEntries: () => [],
	getEntriesByType: () => [],
	getEntriesByName: () => [],
	clearMarks: () => {},
	clearMeasures: () => {},
	clear: () => {},
	timeOrigin: Date.now(),
};

export default {
	performance,
};
