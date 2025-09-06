export const TOOL_NAME = "rag_graph_search";

export enum SearchIntentType {
	TECHNOLOGY = "technology",
	SKILL = "skill",
	PATTERN = "pattern",
	EMPLOYMENT = "employment",
	ACHIEVEMENT = "achievement",
	EDUCATION = "education",
	LEADERSHIP = "leadership",
	CODE = "code",
	GENERAL = "general",
}

export enum EmploymentKeywords {
	WORK_EXPERIENCE = "work experience",
	EMPLOYMENT = "employment",
	CAREER = "career",
	JOB = "job",
	WORKED_AT = "worked at",
	COMPANY = "company",
}

export enum AchievementKeywords {
	ACHIEVEMENT = "achievement",
	ACCOMPLISHED = "accomplished",
	IMPACT = "impact",
	IMPROVED = "improved",
	INCREASED = "increased",
	REDUCED = "reduced",
	DELIVERED = "delivered",
	SAVED = "saved",
}

export enum EducationKeywords {
	EDUCATION = "education",
	DEGREE = "degree",
	UNIVERSITY = "university",
	STUDIED = "studied",
	QUALIFICATION = "qualification",
}

export enum LeadershipKeywords {
	LEADERSHIP = "leadership",
	TEAM = "team",
	MANAGEMENT = "management",
	LEAD = "lead",
	MENTOR = "mentor",
}

export enum TechnologyKeywords {
	REACT = "react",
	TYPESCRIPT = "typescript",
	PYTHON = "python",
	NODE = "node",
	VUE = "vue",
	ANGULAR = "angular",
	DJANGO = "django",
	FASTAPI = "fastapi",
	AWS = "aws",
	AZURE = "azure",
	DOCKER = "docker",
	KUBERNETES = "kubernetes",
}

export enum SkillKeywords {
	EXPERIENCE_WITH = "experience with",
	SKILLS_IN = "skills in",
	PROFICIENT_IN = "proficient in",
}

export enum PatternKeywords {
	MVC = "mvc",
	MICROSERVICE = "microservice",
	REST = "rest",
	GRAPHQL = "graphql",
	SINGLETON = "singleton",
	FACTORY = "factory",
}

export enum CodeKeywords {
	IMPLEMENTATION = "implementation",
	CODE = "code",
	HOW = "how",
}
