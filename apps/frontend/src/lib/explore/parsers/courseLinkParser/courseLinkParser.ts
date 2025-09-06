import { isArray } from "lodash";
import { getLogger } from "@/lib/logger";

export const courseLinkParser = (result: any): string[] => {
	const logger = getLogger();
	try {
		let parsedResult = result;
		if (typeof result === "string") {
			parsedResult = JSON.parse(result);
		}
		if (
			parsedResult.courseLinks &&
			isArray(parsedResult.courseLinks) &&
			typeof parsedResult.courseLinks[0] === "string"
		)
			return parsedResult.courseLinks;
		if (
			parsedResult.toolResults.final_answer &&
			typeof parsedResult.toolResults.final_answer === "string"
		) {
			const finalAnswer = JSON.parse(parsedResult.toolResults.final_answer);
			if (finalAnswer.courseLinks) return finalAnswer.courseLinks;
		}
		if (
			parsedResult.toolResults.final_answer &&
			typeof parsedResult.toolResults.final_answer === "object"
		) {
			if (parsedResult.toolResults.final_answer.courseLinks)
				return parsedResult.toolResults.final_answer.courseLinks;
		}
		return [];
	} catch (e) {
		logger.warn(e, `Error parsing result: ${result}`);
		return [];
	}
};
