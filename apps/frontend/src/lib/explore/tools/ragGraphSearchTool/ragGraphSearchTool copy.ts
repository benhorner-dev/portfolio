import { tool } from "@langchain/core/tools";
import { CohereClient } from "cohere-ai";
import neo4j from "neo4j-driver";
import { DeterministicAgentTrigger } from "@/lib/explore/constants";
import { AgentGraphError } from "@/lib/explore/errors";
import { RagGraphSearchSchema } from "@/lib/explore/schema";
import { getToolConfig } from "@/lib/explore/tools/utils";
import type { RagGraphSearchArgs } from "@/lib/explore/types";
import { getEmbeddings } from "@/lib/explore/vector/getEmbeddings";

const TOOL_NAME = "rag_graph_search";

/* v8 ignore start */
export const ragGraphSearchTool = tool(
	async (props) => portfolioRagGraphSearch(props as RagGraphSearchArgs),
	{
		name: TOOL_NAME,
		description: (await getToolConfig(TOOL_NAME)).description,
		schema: RagGraphSearchSchema,
	},
);
/* v8 ignore stop */
export const portfolioRagGraphSearch = async ({
	query,
	topK,
	embeddingModelName,
	searchOptions = {},
}: PortfolioRagGraphSearchArgs) => {
	const enhancedQuery = query;
	const qvec = await embedQueryText(embeddingModelName, enhancedQuery);

	const searchIntent = parseSearchIntent(query);

	if (
		!process.env.NEO4J_URI ||
		!process.env.NEO4J_USER ||
		!process.env.NEO4J_PASS
	) {
		throw new AgentGraphError(
			"NEO4J_URI, NEO4J_USER, and NEO4J_PASS must be set",
		);
	}

	const driver = neo4j.driver(
		process.env.NEO4J_URI,
		neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASS),
	);

	try {
		let candidates: PortfolioSearchResult[];

		const [vectorResults, graphResults] = await Promise.all([
			(async () => {
				const vectorSession = driver.session();
				try {
					return await performVectorSearch(
						vectorSession,
						qvec,
						topK ?? 10,
						searchOptions,
					);
				} finally {
					await vectorSession.close();
				}
			})(),
			(async () => {
				const graphSession = driver.session();
				try {
					return await performGraphSearch(
						graphSession,
						query,
						searchIntent,
						searchOptions,
					);
				} finally {
					await graphSession.close();
				}
			})(),
		]);

		candidates = mergeResults(vectorResults, graphResults);

		if (candidates.length > 0) {
			const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
			const documents = candidates.map((c) => buildDocumentForRerank(c));

			const reranked = await cohere.rerank({
				model: "rerank-english-v3.0",
				query: enhancedQuery,
				documents,
				topN: topK ?? 10,
			});

			const finalResults = reranked.results.map((r) => candidates[r.index]);

			return formatSearchResponse(query, finalResults, searchIntent);
		}

		return formatSearchResponse(query, candidates.slice(0, topK), searchIntent);
	} finally {
		await driver.close();
	}
};

async function performVectorSearch(
	session: any,
	qvec: number[],
	topK: number,
	options: SearchOptions,
): Promise<PortfolioSearchResult[]> {
	const kNum = Math.max((topK ?? 10) * 10, 100);
	const topNum = Math.max((topK ?? 10) * 5, 50);

	const whereConditions: string[] = [];
	const params: any = {
		qvec,
		k: neo4j.int(Math.trunc(kNum)),
		top: neo4j.int(Math.trunc(topNum)),
	};

	if (options.minComplexity) {
		whereConditions.push("p.complexity >= $minComplexity");
		params.minComplexity = options.minComplexity;
	}

	if (options.dateRange) {
		whereConditions.push(
			"p.completedDate >= date($startDate) AND p.completedDate <= date($endDate)",
		);
		params.startDate = options.dateRange.start;
		params.endDate = options.dateRange.end;
	}

	if (options.technologies?.length) {
		whereConditions.push("ANY(tech IN $techFilter WHERE tech IN technologies)");
		params.techFilter = options.technologies;
	}

	const whereClause =
		whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

	const cypher = `
		// Search projects
		CALL db.index.vector.queryNodes('project_vec_idx', $k, $qvec)
		YIELD node AS p, score AS vecScore

		// Expand to related entities
		OPTIONAL MATCH (p)-[:USES]->(t:Technology)
		OPTIONAL MATCH (p)-[:DEMONSTRATES]->(s:Skill)
		OPTIONAL MATCH (p)-[:IMPLEMENTS]->(pat:Pattern)
		OPTIONAL MATCH (p)-[:CONTAINS]->(f:CodeFile)

		WITH p, vecScore,
			 collect(DISTINCT t.name) AS technologies,
			 collect(DISTINCT s.name) AS skills,
			 collect(DISTINCT pat.name) AS patterns,
			 count(DISTINCT f) AS fileCount

		${whereClause}

		// Also search code chunks if requested
		${
			options.includeCode
				? `
		OPTIONAL MATCH (p)-[:HAS_CHUNK]->(chunk:CodeChunk)
		WITH p, vecScore, technologies, skills, patterns, fileCount,
			 collect(DISTINCT {
				 type: chunk.type,
				 content: chunk.content,
				 metadata: chunk.metadata
			 })[0..3] AS codeSnippets
		`
				: ""
		}

		RETURN 'project' AS resultType,
			   p.id AS id,
			   p.title AS title,
			   p.description AS description,
			   p.role AS role,
			   p.impact AS impact,
			   p.completedDate AS completedDate,
			   p.complexity AS complexity,
			   p.fileCount AS fileCount,
			   p.liveUrl AS liveUrl,
			   p.githubUrl AS githubUrl,
			   technologies,
			   skills,
			   patterns,
			   ${options.includeCode ? "codeSnippets," : "null AS codeSnippets,"}
			   null AS company,
			   null AS position,
			   null AS achievements,
			   vecScore AS score
		ORDER BY vecScore DESC
		LIMIT $top

		UNION ALL

		// Search employment records
		CALL db.index.vector.queryNodes('employment_vec_idx', $k, $qvec)
		YIELD node AS e, score AS empScore

		// Expand employment to related entities
		OPTIONAL MATCH (e)-[:USED_TECHNOLOGY]->(t:Technology)
		OPTIONAL MATCH (e)-[:ACHIEVED]->(a:Achievement)-[:DEMONSTRATES]->(s:Skill)
		OPTIONAL MATCH (e)-[:INCLUDES_PROJECT]->(p:Project)

		WITH e, empScore,
			 collect(DISTINCT t.name) AS technologies,
			 collect(DISTINCT s.name) AS skills,
			 collect(DISTINCT a.description) AS achievements,
			 collect(DISTINCT p.title) AS relatedProjects

		RETURN 'employment' AS resultType,
			   e.id AS id,
			   e.position AS title,
			   e.company + ' - ' +
			   CASE WHEN e.isCurrent THEN 'Current'
			        ELSE toString(e.endDate) END AS description,
			   'professional' AS role,
			   CASE WHEN size(achievements) > 0 THEN achievements[0] ELSE null END AS impact,
			   e.startDate AS completedDate,
			   null AS complexity,
			   size(relatedProjects) AS fileCount,
			   null AS liveUrl,
			   null AS githubUrl,
			   technologies,
			   skills,
			   [] AS patterns,
			   null AS codeSnippets,
			   e.company AS company,
			   e.position AS position,
			   achievements[0..3] AS achievements,
			   empScore AS score
		ORDER BY empScore DESC
		LIMIT $top
	`;

	const res = await session.run(cypher, params);

	return res.records.map((r: any) => ({
		id: r.get("id"),
		title: r.get("title"),
		description: r.get("description"),
		role: r.get("role"),
		impact: r.get("impact"),
		completedDate: r.get("completedDate"),
		complexity: r.get("complexity"),
		fileCount: r.get("fileCount"),
		liveUrl: r.get("liveUrl"),
		githubUrl: r.get("githubUrl"),
		technologies: r.get("technologies"),
		skills: r.get("skills"),
		patterns: r.get("patterns"),
		codeSnippets: options.includeCode ? r.get("codeSnippets") : undefined,
		resultType: r.get("resultType"),
		company: r.get("company"),
		position: r.get("position"),
		achievements: r.get("achievements"),
		score: r.get("score"),
		matchType: "semantic",
	}));
}

async function performGraphSearch(
	session: any,
	query: string,
	searchIntent: SearchIntent,
	_options: SearchOptions,
): Promise<PortfolioSearchResult[]> {
	let cypher: string;
	const params: any = { query };

	if (searchIntent.type === "technology") {
		cypher = `
			MATCH (t:Technology {name: $techName})<-[:USES]-(p:Project)
			OPTIONAL MATCH (p)-[:DEMONSTRATES]->(s:Skill)
			OPTIONAL MATCH (p)-[:IMPLEMENTS]->(pat:Pattern)

			WITH p, collect(DISTINCT s.name) AS skills,
				 collect(DISTINCT pat.name) AS patterns,
				 [(p)-[:USES]->(tech:Technology) | tech.name] AS technologies

			RETURN 'project' AS resultType,
				   p.id AS id,
				   p.title AS title,
				   p.description AS description,
				   p.role AS role,
				   p.impact AS impact,
				   p.completedDate AS completedDate,
				   p.complexity AS complexity,
				   p.fileCount AS fileCount,
				   p.liveUrl AS liveUrl,
				   p.githubUrl AS githubUrl,
				   technologies,
				   skills,
				   patterns,
				   null AS codeSnippets,
				   null AS company,
				   null AS position,
				   null AS achievements,
				   1.0 AS score
			ORDER BY p.completedDate DESC
		`;
		params.techName = searchIntent.value;
	} else if (searchIntent.type === "skill") {
		// Skill-based search with progression
		cypher = `
			MATCH (s:Skill)<-[:DEMONSTRATES]-(p:Project)
			WHERE s.name CONTAINS $skillName
			OPTIONAL MATCH (p)-[:USES]->(t:Technology)
			OPTIONAL MATCH (p)-[:IMPLEMENTS]->(pat:Pattern)

			WITH p, s, collect(DISTINCT t.name) AS technologies,
				 collect(DISTINCT pat.name) AS patterns

			RETURN 'project' AS resultType,
				   p.id AS id,
				   p.title AS title,
				   p.description AS description,
				   p.role AS role,
				   p.impact AS impact,
				   p.completedDate AS completedDate,
				   p.complexity AS complexity,
				   p.fileCount AS fileCount,
				   p.liveUrl AS liveUrl,
				   p.githubUrl AS githubUrl,
				   technologies,
				   [s.name] AS skills,
				   patterns,
				   null AS codeSnippets,
				   null AS company,
				   null AS position,
				   null AS achievements,
				   p.complexity / 10.0 AS score
			ORDER BY p.completedDate DESC
		`;
		params.skillName = searchIntent.value;
	} else if (searchIntent.type === "pattern") {
		// Design pattern search
		cypher = `
			MATCH (pat:Pattern {name: $patternName})<-[:IMPLEMENTS]-(p:Project)
			OPTIONAL MATCH (p)-[:USES]->(t:Technology)
			OPTIONAL MATCH (p)-[:DEMONSTRATES]->(s:Skill)

			WITH p, collect(DISTINCT t.name) AS technologies,
				 collect(DISTINCT s.name) AS skills,
				 [pat.name] AS patterns

			RETURN 'project' AS resultType,
				   p.id AS id,
				   p.title AS title,
				   p.description AS description,
				   p.role AS role,
				   p.impact AS impact,
				   p.completedDate AS completedDate,
				   p.complexity AS complexity,
				   p.fileCount AS fileCount,
				   p.liveUrl AS liveUrl,
				   p.githubUrl AS githubUrl,
				   technologies,
				   skills,
				   patterns,
				   null AS codeSnippets,
				   null AS company,
				   null AS position,
				   null AS achievements,
				   1.0 AS score
		`;
		params.patternName = searchIntent.value;
	} else if (searchIntent.type === "employment") {
		// Employment/career queries
		cypher = `
			MATCH (e:Employment)
			OPTIONAL MATCH (e)-[:USED_TECHNOLOGY]->(t:Technology)
			OPTIONAL MATCH (e)-[:ACHIEVED]->(a:Achievement)
			OPTIONAL MATCH (e)-[:INCLUDES_PROJECT]->(p:Project)

			WHERE e.company CONTAINS $query OR e.position CONTAINS $query
			   OR ANY(achievement IN e.achievements WHERE achievement CONTAINS $query)

			WITH e, collect(DISTINCT t.name) AS technologies,
				 collect(DISTINCT a.description) AS achievements,
				 collect(DISTINCT p.title) AS relatedProjects

			RETURN 'employment' AS resultType,
				   e.id AS id,
				   e.position AS title,
				   e.company + ' (' + toString(e.startDate) +
				   CASE WHEN e.isCurrent THEN ' - Present)'
				        ELSE ' - ' + toString(e.endDate) + ')' END AS description,
				   'professional' AS role,
				   CASE WHEN size(achievements) > 0 THEN achievements[0] ELSE null END AS impact,
				   e.startDate AS completedDate,
				   null AS complexity,
				   size(relatedProjects) AS fileCount,
				   null AS liveUrl,
				   null AS githubUrl,
				   technologies,
				   [] AS skills,
				   [] AS patterns,
				   null AS codeSnippets,
				   e.company AS company,
				   e.position AS position,
				   achievements[0..3] AS achievements,
				   1.0 AS score
			ORDER BY e.startDate DESC
		`;
	} else if (searchIntent.type === "achievement") {
		// Achievement/impact queries
		cypher = `
			CALL db.index.fulltext.queryNodes('achievement_search', $query)
			YIELD node AS a, score

			MATCH (a)<-[:ACHIEVED]-(e:Employment)
			OPTIONAL MATCH (a)-[:DEMONSTRATES]->(s:Skill)
			OPTIONAL MATCH (e)-[:USED_TECHNOLOGY]->(t:Technology)

			WITH a, e, score,
				 collect(DISTINCT s.name) AS skills,
				 collect(DISTINCT t.name) AS technologies

			RETURN 'achievement' AS resultType,
				   a.id AS id,
				   'Achievement at ' + e.company AS title,
				   a.description AS description,
				   'achievement' AS role,
				   a.description AS impact,
				   e.startDate AS completedDate,
				   CASE a.impact
				     WHEN 'high' THEN 8
				     WHEN 'medium' THEN 5
				     WHEN 'low' THEN 3
				     ELSE 1 END AS complexity,
				   null AS fileCount,
				   null AS liveUrl,
				   null AS githubUrl,
				   technologies,
				   skills,
				   [] AS patterns,
				   null AS codeSnippets,
				   e.company AS company,
				   e.position AS position,
				   [a.description] AS achievements,
				   score
			ORDER BY score DESC
			LIMIT 20
		`;
	} else if (searchIntent.type === "education") {
		// Education queries
		cypher = `
			MATCH (ed:Education)
			OPTIONAL MATCH (ed)-[:AT_INSTITUTION]->(i:Institution)
			OPTIONAL MATCH (ed)-[:FOR_DEGREE]->(d:Degree)
			OPTIONAL MATCH (ed)-[:COVERED]->(s:Subject)

			WHERE i.name CONTAINS $query OR d.name CONTAINS $query
			   OR ANY(subject IN collect(s.name) WHERE subject CONTAINS $query)

			WITH ed, i, d, collect(DISTINCT s.name) AS subjects

			RETURN 'education' AS resultType,
				   ed.id AS id,
				   d.name + ' at ' + i.name AS title,
				   'Graduated ' + toString(ed.endDate) +
				   CASE WHEN ed.grade IS NOT NULL THEN ' with ' + ed.grade ELSE '' END AS description,
				   'education' AS role,
				   null AS impact,
				   ed.endDate AS completedDate,
				   null AS complexity,
				   size(subjects) AS fileCount,
				   null AS liveUrl,
				   null AS githubUrl,
				   [] AS technologies,
				   subjects AS skills,
				   [] AS patterns,
				   null AS codeSnippets,
				   i.name AS company,
				   d.name AS position,
				   [] AS achievements,
				   1.0 AS score
			ORDER BY ed.endDate DESC
		`;
	} else if (searchIntent.type === "leadership") {
		// Leadership/management queries
		cypher = `
			CALL db.index.fulltext.queryNodes('employment_search', $query)
			YIELD node AS e, score

			OPTIONAL MATCH (e)-[:ACHIEVED]->(a:Achievement)
			WHERE a.description CONTAINS 'lead' OR a.description CONTAINS 'team'
			   OR a.description CONTAINS 'manage' OR a.description CONTAINS 'mentor'

			OPTIONAL MATCH (e)-[:USED_TECHNOLOGY]->(t:Technology)

			WITH e, score,
				 collect(DISTINCT a.description) AS achievements,
				 collect(DISTINCT t.name) AS technologies

			WHERE size(achievements) > 0

			RETURN 'leadership' AS resultType,
				   e.id AS id,
				   'Leadership at ' + e.company AS title,
				   e.position + ' - Leadership & Management Experience' AS description,
				   'leadership' AS role,
				   CASE WHEN size(achievements) > 0 THEN achievements[0] ELSE null END AS impact,
				   e.startDate AS completedDate,
				   size(achievements) AS complexity,
				   null AS fileCount,
				   null AS liveUrl,
				   null AS githubUrl,
				   technologies,
				   ['Leadership', 'Team Management'] AS skills,
				   [] AS patterns,
				   null AS codeSnippets,
				   e.company AS company,
				   e.position AS position,
				   achievements[0..3] AS achievements,
				   score
			ORDER BY score DESC
			LIMIT 20
		`;
	} else {
		// General full-text search
		cypher = `
			CALL db.index.fulltext.queryNodes('project_search', $query)
			YIELD node AS p, score

			OPTIONAL MATCH (p)-[:USES]->(t:Technology)
			OPTIONAL MATCH (p)-[:DEMONSTRATES]->(s:Skill)
			OPTIONAL MATCH (p)-[:IMPLEMENTS]->(pat:Pattern)

			WITH p, score, collect(DISTINCT t.name) AS technologies,
				 collect(DISTINCT s.name) AS skills,
				 collect(DISTINCT pat.name) AS patterns

			RETURN 'project' AS resultType,
				   p.id AS id,
				   p.title AS title,
				   p.description AS description,
				   p.role AS role,
				   p.impact AS impact,
				   p.completedDate AS completedDate,
				   p.complexity AS complexity,
				   p.fileCount AS fileCount,
				   p.liveUrl AS liveUrl,
				   p.githubUrl AS githubUrl,
				   technologies,
				   skills,
				   patterns,
				   null AS codeSnippets,
				   null AS company,
				   null AS position,
				   null AS achievements,
				   score
			ORDER BY score DESC
			LIMIT 20
		`;
	}

	const res = await session.run(cypher, params);

	return res.records.map((r: any) => ({
		id: r.get("id"),
		title: r.get("title"),
		description: r.get("description"),
		role: r.get("role"),
		impact: r.get("impact"),
		completedDate: r.get("completedDate"),
		complexity: r.get("complexity"),
		fileCount: r.get("fileCount"),
		liveUrl: r.get("liveUrl"),
		githubUrl: r.get("githubUrl"),
		technologies: r.get("technologies"),
		skills: r.get("skills"),
		patterns: r.get("patterns"),
		// New professional data fields
		resultType: r.get("resultType") || "project",
		company: r.get("company"),
		position: r.get("position"),
		achievements: r.get("achievements"),
		score: r.get("score"),
		matchType: "graph",
	}));
}

function mergeResults(
	vectorResults: PortfolioSearchResult[],
	graphResults: PortfolioSearchResult[],
): PortfolioSearchResult[] {
	const merged = new Map<string, PortfolioSearchResult>();

	// Add vector results with boost
	for (const result of vectorResults) {
		merged.set(result.id, {
			...result,
			score: result.score * 1.2,
			matchType: "hybrid",
		});
	}

	// Merge or add graph results
	for (const result of graphResults) {
		if (merged.has(result.id)) {
			const existing = merged.get(result.id)!;
			existing.score += result.score;
			existing.matchType = "hybrid";
		} else {
			merged.set(result.id, result);
		}
	}

	// Sort by combined score
	return Array.from(merged.values()).sort((a, b) => b.score - a.score);
}

function parseSearchIntent(query: string): SearchIntent {
	const lowerQuery = query.toLowerCase();

	// Professional/Career queries
	if (
		lowerQuery.includes("work experience") ||
		lowerQuery.includes("employment") ||
		lowerQuery.includes("career") ||
		lowerQuery.includes("job") ||
		lowerQuery.includes("worked at") ||
		lowerQuery.includes("company")
	) {
		return { type: "employment", value: query };
	}

	// Achievement/Impact queries
	if (
		lowerQuery.includes("achievement") ||
		lowerQuery.includes("accomplished") ||
		lowerQuery.includes("impact") ||
		lowerQuery.includes("improved") ||
		lowerQuery.includes("increased") ||
		lowerQuery.includes("reduced") ||
		lowerQuery.includes("delivered") ||
		lowerQuery.includes("saved")
	) {
		return { type: "achievement", value: query };
	}

	// Education queries
	if (
		lowerQuery.includes("education") ||
		lowerQuery.includes("degree") ||
		lowerQuery.includes("university") ||
		lowerQuery.includes("studied") ||
		lowerQuery.includes("qualification")
	) {
		return { type: "education", value: query };
	}

	// Leadership/Management queries
	if (
		lowerQuery.includes("leadership") ||
		lowerQuery.includes("team") ||
		lowerQuery.includes("management") ||
		lowerQuery.includes("lead") ||
		lowerQuery.includes("mentor")
	) {
		return { type: "leadership", value: query };
	}

	// Technology detection
	const techKeywords = [
		"react",
		"typescript",
		"python",
		"node",
		"vue",
		"angular",
		"django",
		"fastapi",
		"aws",
		"azure",
		"docker",
		"kubernetes",
	];
	for (const tech of techKeywords) {
		if (lowerQuery.includes(tech)) {
			return { type: "technology", value: tech };
		}
	}

	// Skill detection
	if (
		lowerQuery.includes("experience with") ||
		lowerQuery.includes("skills in") ||
		lowerQuery.includes("proficient in")
	) {
		const skillMatch = lowerQuery.match(
			/(?:experience with|skills in|proficient in)\s+(\w+)/,
		);
		if (skillMatch) {
			return { type: "skill", value: skillMatch[1] };
		}
	}

	// Pattern detection
	const patternKeywords = [
		"mvc",
		"microservice",
		"rest",
		"graphql",
		"singleton",
		"factory",
	];
	for (const pattern of patternKeywords) {
		if (lowerQuery.includes(pattern)) {
			return { type: "pattern", value: pattern };
		}
	}

	// Code-specific queries
	if (
		lowerQuery.includes("implementation") ||
		lowerQuery.includes("code") ||
		lowerQuery.includes("how")
	) {
		return { type: "code", value: query };
	}

	return { type: "general", value: query };
}

function determineSearchStrategy(
	intent: SearchIntent,
): "vector" | "graph" | "hybrid" {
	switch (intent.type) {
		case "technology":
		case "pattern":
		case "education":
			return "graph"; // Direct graph traversal is better
		case "skill":
		case "leadership":
		case "employment":
		case "achievement":
			return "hybrid"; // Benefit from both approaches
		case "code":
		case "general":
		default:
			return "vector"; // Semantic search is primary
	}
}

function buildDocumentForRerank(result: PortfolioSearchResult): string {
	return JSON.stringify({
		title: result.title,
		description: result.description,
		role: result.role,
		impact: result.impact,
		technologies: result.technologies.join(", "),
		skills: result.skills.join(", "),
		patterns: result.patterns.join(", "),
		complexity: `${result.complexity}/10`,
		completedDate: result.completedDate,
		matchType: result.matchType,
	});
}

function formatSearchResponse(
	query: string,
	results: PortfolioSearchResult[],
	intent: SearchIntent,
): string {
	const response = {
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
			// Professional data fields
			company: r.company,
			position: r.position,
			achievements: r.achievements,
			match_type: r.matchType,
			relevance_score: r.score.toFixed(3),
			code_snippets: r.codeSnippets,
		})),
		deterministicTrigger: DeterministicAgentTrigger.ABORT,
	};

	return JSON.stringify(response, null, 2);
}

// Type definitions
interface PortfolioRagGraphSearchArgs {
	query: string;
	topK?: number;
	embeddingModelName: string;
	searchOptions?: SearchOptions;
}

interface SearchOptions {
	includeCode?: boolean;
	minComplexity?: number;
	dateRange?: {
		start: string;
		end: string;
	};
	technologies?: string[];
	role?: "personal" | "professional" | "opensource";
}

interface SearchIntent {
	type:
		| "technology"
		| "skill"
		| "pattern"
		| "employment"
		| "achievement"
		| "education"
		| "leadership"
		| "code"
		| "general";
	value: string;
}

interface PortfolioSearchResult {
	id: string;
	title: string;
	description: string;
	role: string;
	impact?: string;
	completedDate: string;
	complexity: number;
	fileCount: number;
	liveUrl?: string;
	githubUrl?: string;
	technologies: string[];
	skills: string[];
	patterns: string[];
	codeSnippets?: any[];
	// New professional data fields
	resultType?: string;
	company?: string;
	position?: string;
	achievements?: string[];
	score: number;
	matchType: "semantic" | "graph" | "hybrid";
}

async function embedQueryText(embeddingModelName: string, query: string) {
	const embeddings = await getEmbeddings(embeddingModelName);
	if (typeof embeddings.embedQuery === "function") {
		return embeddings.embedQuery(query);
	}
	const [arr] = await embeddings.embedDocuments([query]);
	return arr;
}
