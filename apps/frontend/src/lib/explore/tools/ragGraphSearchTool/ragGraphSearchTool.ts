import { tool } from "@langchain/core/tools";
import { CohereClient } from "cohere-ai";
import neo4j, { type Session } from "neo4j-driver";
import { DeterministicAgentTrigger } from "@/lib/explore/constants";
import { AgentGraphError } from "@/lib/explore/errors";
import { RagGraphSearchSchema } from "@/lib/explore/schema";
import { getToolConfig } from "@/lib/explore/tools/utils";
import type { RagGraphSearchArgs } from "@/lib/explore/types";
import { getEmbeddings } from "@/lib/explore/vector/getEmbeddings";
import {
	AchievementKeywords,
	CodeKeywords,
	EducationKeywords,
	EmploymentKeywords,
	LeadershipKeywords,
	PatternKeywords,
	SearchIntentType,
	SkillKeywords,
	TechnologyKeywords,
	TOOL_NAME,
} from "./constants";
import {
	DocumentForRerankSchema,
	GraphNeo4jRecordSchema,
	SearchResponseSchema,
	SemanticNeo4jRecordSchema,
} from "./schema";
import type {
	GraphCypherStrategy,
	GraphSearchParams,
	PortfolioRagGraphSearchArgs,
	PortfolioSearchResult,
	SearchIntent,
	SearchOptions,
	VectorSearchParams,
} from "./types";

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
	session: Session,
	qvec: number[],
	topK: number,
	options: SearchOptions,
): Promise<PortfolioSearchResult[]> {
	const kNum = Math.max((topK ?? 10) * 10, 100);
	const topNum = Math.max((topK ?? 10) * 5, 50);

	const whereConditions: string[] = [];
	const params: VectorSearchParams = {
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
		CALL db.index.vector.queryNodes('project_vec_idx', $k, $qvec)
		YIELD node AS p, score AS vecScore

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

		CALL db.index.vector.queryNodes('employment_vec_idx', $k, $qvec)
		YIELD node AS e, score AS empScore

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

	return res.records.map((r) =>
		SemanticNeo4jRecordSchema.parse({
			record: r,
			includeCode: options.includeCode,
		}),
	);
}

function getTechnologyCypher(params: GraphSearchParams): string {
	params.techName = params.query;
	return `
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
}

function getSkillCypher(params: GraphSearchParams): string {
	params.skillName = params.query;
	return `
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
}

function getPatternCypher(params: GraphSearchParams): string {
	params.patternName = params.query;
	return `
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
}

function getEmploymentCypher(_params: GraphSearchParams): string {
	return `
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
}

function getAchievementCypher(_params: GraphSearchParams): string {
	return `
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
}

function getEducationCypher(_params: GraphSearchParams): string {
	return `
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
}

function getLeadershipCypher(_params: GraphSearchParams): string {
	return `
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
}

function getDefaultCypher(_params: GraphSearchParams): string {
	return `
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

function getGraphCypherStrategy(
	searchIntentType: SearchIntentType,
): GraphCypherStrategy {
	switch (searchIntentType) {
		case SearchIntentType.TECHNOLOGY:
			return getTechnologyCypher;
		case SearchIntentType.SKILL:
			return getSkillCypher;
		case SearchIntentType.PATTERN:
			return getPatternCypher;
		case SearchIntentType.EMPLOYMENT:
			return getEmploymentCypher;
		case SearchIntentType.ACHIEVEMENT:
			return getAchievementCypher;
		case SearchIntentType.EDUCATION:
			return getEducationCypher;
		case SearchIntentType.LEADERSHIP:
			return getLeadershipCypher;
		default:
			return getDefaultCypher;
	}
}

async function performGraphSearch(
	session: Session,
	query: string,
	searchIntent: SearchIntent,
	_options: SearchOptions,
): Promise<PortfolioSearchResult[]> {
	const params: GraphSearchParams = { query };
	const strategy = getGraphCypherStrategy(searchIntent.type);
	const cypher = strategy(params);

	const res = await session.run(cypher, params);

	return res.records.map((r) => GraphNeo4jRecordSchema.parse({ record: r }));
}

function mergeResults(
	vectorResults: PortfolioSearchResult[],
	graphResults: PortfolioSearchResult[],
): PortfolioSearchResult[] {
	const merged = new Map<string, PortfolioSearchResult>();

	for (const result of vectorResults) {
		merged.set(result.id, {
			...result,
			score: result.score * 1.2,
			matchType: "hybrid",
		});
	}

	for (const result of graphResults) {
		if (merged.has(result.id)) {
			const existing = merged.get(result.id);
			if (existing) {
				existing.score += result.score;
				existing.matchType = "hybrid";
			}
		} else {
			merged.set(result.id, result);
		}
	}

	return Array.from(merged.values()).sort((a, b) => b.score - a.score);
}

function parseSearchIntent(query: string): SearchIntent {
	const lowerQuery = query.toLowerCase();

	const employmentKeywords = Object.values(EmploymentKeywords);
	if (employmentKeywords.some((keyword) => lowerQuery.includes(keyword))) {
		return { type: SearchIntentType.EMPLOYMENT, value: query };
	}

	const achievementKeywords = Object.values(AchievementKeywords);
	if (achievementKeywords.some((keyword) => lowerQuery.includes(keyword))) {
		return { type: SearchIntentType.ACHIEVEMENT, value: query };
	}

	const educationKeywords = Object.values(EducationKeywords);
	if (educationKeywords.some((keyword) => lowerQuery.includes(keyword))) {
		return { type: SearchIntentType.EDUCATION, value: query };
	}

	const leadershipKeywords = Object.values(LeadershipKeywords);
	if (leadershipKeywords.some((keyword) => lowerQuery.includes(keyword))) {
		return { type: SearchIntentType.LEADERSHIP, value: query };
	}

	const techKeywords = Object.values(TechnologyKeywords);
	for (const tech of techKeywords) {
		if (lowerQuery.includes(tech)) {
			return { type: SearchIntentType.TECHNOLOGY, value: tech };
		}
	}

	const skillKeywords = Object.values(SkillKeywords);
	if (skillKeywords.some((keyword) => lowerQuery.includes(keyword))) {
		const skillMatch = lowerQuery.match(
			/(?:experience with|skills in|proficient in)\s+(\w+)/,
		);
		if (skillMatch) {
			return { type: SearchIntentType.SKILL, value: skillMatch[1] };
		}
	}

	const patternKeywords = Object.values(PatternKeywords);
	for (const pattern of patternKeywords) {
		if (lowerQuery.includes(pattern)) {
			return { type: SearchIntentType.PATTERN, value: pattern };
		}
	}

	const codeKeywords = Object.values(CodeKeywords);
	if (codeKeywords.some((keyword) => lowerQuery.includes(keyword))) {
		return { type: SearchIntentType.CODE, value: query };
	}

	return { type: SearchIntentType.GENERAL, value: query };
}

function buildDocumentForRerank(result: PortfolioSearchResult): string {
	const document = DocumentForRerankSchema.parse({
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

	return JSON.stringify(document);
}

function formatSearchResponse(
	query: string,
	results: PortfolioSearchResult[],
	intent: SearchIntent,
): string {
	const inputData = {
		query,
		results,
		intent,
		deterministicTrigger: DeterministicAgentTrigger.ABORT,
	};

	const response = SearchResponseSchema.parse(inputData);
	return JSON.stringify(response, null, 2);
}

async function embedQueryText(embeddingModelName: string, query: string) {
	const embeddings = await getEmbeddings(embeddingModelName);
	if (typeof embeddings.embedQuery === "function") {
		return embeddings.embedQuery(query);
	}
	const [arr] = await embeddings.embedDocuments([query]);
	return arr;
}
