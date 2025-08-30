import type { z } from "zod";

export type ErrorHandler = (
	error: unknown,
	context: { schema: z.ZodTypeAny; rawData: unknown },
) => never;

export function configParser<T extends z.ZodTypeAny>(
	schema: T,
	rawData: unknown,
	onError: ErrorHandler,
): z.infer<T> {
	try {
		return schema.parse(rawData);
	} catch (error) {
		return onError(error, { schema, rawData });
	}
}
