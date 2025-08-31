import { describe, expect, it, vi } from "vitest";
import githubImage from "@/public/images/github.png";
import heroImage from "@/public/images/hero.png";
import linkedInImage from "@/public/images/linked-in.png";
import { ImageSrc } from "./constants";
import { ImageSrcError } from "./errors";
import { getImageSrc } from "./utils";

vi.mock("@/public/images/hero.png", () => ({
	default: {
		src: "/_next/static/media/hero.hash.png",
		height: 1080,
		width: 1920,
		blurDataURL:
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
		blurWidth: 1,
		blurHeight: 1,
	},
}));

vi.mock("@/public/images/linked-in.png", () => ({
	default: {
		src: "/_next/static/media/linked-in.hash.png",
		height: 64,
		width: 64,
		blurDataURL:
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
		blurWidth: 1,
		blurHeight: 1,
	},
}));

vi.mock("@/public/images/github.png", () => ({
	default: {
		src: "/_next/static/media/github.hash.png",
		height: 64,
		width: 64,
		blurDataURL:
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
		blurWidth: 1,
		blurHeight: 1,
	},
}));

describe("getImageSrc", () => {
	it("returns hero image for HERO source", () => {
		const result = getImageSrc(ImageSrc.HERO);
		expect(result).toBe(heroImage);
	});

	it("returns linkedin image for LINKEDIN source", () => {
		const result = getImageSrc(ImageSrc.LINKEDIN);
		expect(result).toBe(linkedInImage);
	});

	it("returns github image for GITHUB source", () => {
		const result = getImageSrc(ImageSrc.GITHUB);
		expect(result).toBe(githubImage);
	});

	it("throws ImageSrcError for unknown source", () => {
		expect(() => getImageSrc("unknown-source")).toThrow(ImageSrcError);
		expect(() => getImageSrc("unknown-source")).toThrow(
			"Image source unknown-source not found",
		);
	});

	it("throws ImageSrcError for empty string", () => {
		expect(() => getImageSrc("")).toThrow(ImageSrcError);
		expect(() => getImageSrc("")).toThrow("Image source  not found");
	});

	it("throws ImageSrcError for null-like values", () => {
		expect(() => getImageSrc(null as any)).toThrow(ImageSrcError);
		expect(() => getImageSrc(undefined as any)).toThrow(ImageSrcError);
	});
});
