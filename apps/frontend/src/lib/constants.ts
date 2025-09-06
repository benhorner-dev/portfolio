export enum Environment {
	PRODUCTION = "production",
	DEVELOPMENT = "development",
	PREVIEW = "preview",
	TRUE = "true",
}

export enum ImageSrc {
	HERO = "/images/hero.png",
	LINKEDIN = "/images/linked-in.png",
	GITHUB = "/images/github.png",
}

export const TOKEN_LIMIT = parseInt(process.env.TOKEN_LIMIT || "10_000", 10);
