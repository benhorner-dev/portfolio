// Mock for node:fs in Storybook
export const readFileSync = () => {
	throw new Error("readFileSync should not be called in Storybook");
};

export const writeFileSync = () => {
	throw new Error("writeFileSync should not be called in Storybook");
};

export const readFile = () => {
	throw new Error("readFile should not be called in Storybook");
};

export const writeFile = () => {
	throw new Error("writeFile should not be called in Storybook");
};

export const existsSync = () => {
	throw new Error("existsSync should not be called in Storybook");
};

export const mkdirSync = () => {
	throw new Error("mkdirSync should not be called in Storybook");
};

export const statSync = () => {
	throw new Error("statSync should not be called in Storybook");
};

export default {
	readFileSync,
	writeFileSync,
	readFile,
	writeFile,
	existsSync,
	mkdirSync,
	statSync,
};
