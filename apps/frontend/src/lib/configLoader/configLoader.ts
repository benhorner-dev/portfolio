import { readFileSync } from "node:fs";

export type ConfigLoadErrorHandler = (
	error: unknown,
	context: { configPath: string },
) => never;

export function configLoader(
	configPath: string,
	onError: ConfigLoadErrorHandler,
): unknown {
	try {
		const configFile = readFileSync(configPath, "utf8");
		const config: unknown = JSON.parse(configFile);
		return config;
	} catch (error) {
		return onError(error, { configPath });
	}
}
