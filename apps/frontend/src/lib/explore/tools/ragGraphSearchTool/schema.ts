import { z } from "zod";

export const PortfolioSearchResultSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	role: z.string(),
	impact: z.string().nullable().optional(),
	completedDate: z.string(),
	complexity: z.number(),
	fileCount: z.number(),
	liveUrl: z.string().nullable().optional(),
	githubUrl: z.string().nullable().optional(),
	technologies: z.array(z.string()),
	skills: z.array(z.string()),
	patterns: z.array(z.string()),
	codeSnippets: z.array(z.unknown()).nullable().optional(),
	resultType: z.string().nullable().optional(),
	company: z.string().nullable().optional(),
	position: z.string().nullable().optional(),
	achievements: z.array(z.string()).nullable().optional(),
	score: z.number(),
	matchType: z.enum(["semantic", "graph", "hybrid"]),
});

export const extractNeo4jRecord = (record: unknown) => {
	const recordObj = record as { get: (key: string) => unknown };
	return z
		.object({
			id: z
				.string()
				.nullable()
				.transform((val) => val ?? ""),
			title: z
				.string()
				.nullable()
				.transform((val) => val ?? ""),
			description: z
				.string()
				.nullable()
				.transform((val) => val ?? ""),
			role: z
				.string()
				.nullable()
				.transform((val) => val ?? ""),
			impact: z.string().nullable().optional(),
			completedDate: z
				.unknown()
				.nullable()
				.transform((val) => {
					if (!val) return "";
					if (val instanceof Date) return val.toISOString();
					if (typeof val === "string") return val;
					if (val && typeof val === "object" && "toString" in val)
						return val.toString();
					return String(val);
				}),
			complexity: z
				.unknown()
				.nullable()
				.transform((val) => (val ? Number(val) : 0)),
			fileCount: z
				.unknown()
				.nullable()
				.transform((val) => (val ? Number(val) : 0)),
			liveUrl: z.string().nullable().optional(),
			githubUrl: z.string().nullable().optional(),
			technologies: z
				.array(z.string())
				.nullable()
				.transform((val) => val ?? []),
			skills: z
				.array(z.string())
				.nullable()
				.transform((val) => val ?? []),
			patterns: z
				.array(z.string())
				.nullable()
				.transform((val) => val ?? []),
			company: z.string().nullable().optional(),
			position: z.string().nullable().optional(),
			achievements: z.array(z.string()).nullable().optional(),
			score: z
				.unknown()
				.nullable()
				.transform((val) => (val ? Number(val) : 0)),
			codeSnippets: z.array(z.unknown()).nullable().optional(),
			resultType: z.string().nullable().optional(),
		})
		.parse({
			id: recordObj.get("id"),
			title: recordObj.get("title"),
			description: recordObj.get("description"),
			role: recordObj.get("role"),
			impact: recordObj.get("impact"),
			completedDate: recordObj.get("completedDate"),
			complexity: recordObj.get("complexity"),
			fileCount: recordObj.get("fileCount"),
			liveUrl: recordObj.get("liveUrl"),
			githubUrl: recordObj.get("githubUrl"),
			technologies: recordObj.get("technologies"),
			skills: recordObj.get("skills"),
			patterns: recordObj.get("patterns"),
			company: recordObj.get("company"),
			position: recordObj.get("position"),
			achievements: recordObj.get("achievements"),
			score: recordObj.get("score"),
			codeSnippets: recordObj.get("codeSnippets"),
			resultType: recordObj.get("resultType"),
		});
};

export const SemanticNeo4jRecordSchema = z
	.object({
		record: z.unknown(),
		includeCode: z.boolean().optional(),
	})
	.transform(({ record, includeCode }) => {
		const base = extractNeo4jRecord(record);
		return {
			...base,
			codeSnippets: includeCode ? base.codeSnippets : undefined,
			resultType: base.resultType,
			matchType: "semantic" as const,
		};
	});

export const GraphNeo4jRecordSchema = z
	.object({
		record: z.unknown(),
	})
	.transform(({ record }) => {
		const base = extractNeo4jRecord(record);
		return {
			...base,
			codeSnippets: undefined,
			resultType: base.resultType || "project",
			matchType: "graph" as const,
		};
	});

export const DocumentForRerankSchema = z.object({
	title: z.string(),
	description: z.string(),
	role: z.string(),
	impact: z.string().nullable().optional(),
	technologies: z.string(),
	skills: z.string(),
	patterns: z.string(),
	complexity: z.string(),
	completedDate: z.string(),
	matchType: z.enum(["semantic", "graph", "hybrid"]),
});

export const SearchResponseInputSchema = z.object({
	query: z.string(),
	results: z.array(PortfolioSearchResultSchema),
	intent: z.object({
		type: z.string(),
		value: z.string(),
	}),
	deterministicTrigger: z.string(),
});

export const SearchResponseSchema = SearchResponseInputSchema.transform(
	({ query, results, intent, deterministicTrigger }) => ({
		query,
		intent: intent.type,
		total_results: results.length,
		results: results.map((r) => ({
			result_type: r.resultType || "project",
			title: r.title,
			description: r.description,
			role: r.role,
			impact: r.impact,
			completed: r.completedDate,
			complexity: r.complexity ? `${r.complexity}/10` : null,
			technologies: r.technologies,
			skills: r.skills,
			patterns: r.patterns,
			file_count: r.fileCount,
			live_url: r.liveUrl,
			github_url: r.githubUrl,
			company: r.company,
			position: r.position,
			achievements: r.achievements,
			match_type: r.matchType,
			relevance_score: r.score.toFixed(3),
			code_snippets: r.codeSnippets,
		})),
		deterministicTrigger,
	}),
);
