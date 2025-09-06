import type { Integer } from "neo4j-driver";
import type { SearchIntentType } from "./constants";

export interface PortfolioRagGraphSearchArgs {
	query: string;
	topK?: number;
	embeddingModelName: string;
	searchOptions?: SearchOptions;
}

export interface SearchOptions {
	includeCode?: boolean;
	minComplexity?: number;
	dateRange?: {
		start: string;
		end: string;
	};
	technologies?: string[];
	role?: "personal" | "professional" | "opensource";
}

export interface VectorSearchParams {
	qvec: number[];
	k: Integer;
	top: Integer;
	minComplexity?: number;
	startDate?: string;
	endDate?: string;
	techFilter?: string[];
}

export interface GraphSearchParams {
	query: string;
	techName?: string;
	skillName?: string;
	patternName?: string;
}

export interface SearchIntent {
	type: SearchIntentType;
	value: string;
}

export type GraphCypherStrategy = (params: GraphSearchParams) => string;

export interface PortfolioSearchResult {
	id: string;
	title: string;
	description: string;
	role: string;
	impact?: string | null;
	completedDate: string;
	complexity: number;
	fileCount: number;
	liveUrl?: string | null;
	githubUrl?: string | null;
	technologies: string[];
	skills: string[];
	patterns: string[];
	codeSnippets?: unknown[] | null;
	resultType?: string | null;
	company?: string | null;
	position?: string | null;
	achievements?: string[] | null;
	score: number;
	matchType: "semantic" | "graph" | "hybrid";
}
