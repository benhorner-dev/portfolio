import { beforeEach, describe, expect, it, vi } from "vitest";
import type z from "zod";
import { configLoader } from "./configLoader";
import { configParser } from "./configParser";
import {
	ContentConfigError,
	ContentConfigLoadError,
	ContentConfigParseError,
} from "./errors";
import { getContentConfig } from "./getContentConfig";

vi.mock("./configLoader");
vi.mock("./configParser");
vi.mock("next/cache", () => ({
	unstable_cache: vi.fn((fn) => fn),
}));

const mockConfigLoader = vi.mocked(configLoader);
const mockConfigParser = vi.mocked(configParser);

describe("getContentConfig", () => {
	const mockConfig = {
		background: { src: "test.jpg", alt: "Test" },
		hero: {
			title: "Test",
			description: "Test desc",
			ctaButton: { text: "Click" },
		},
		chat: {
			header: { title: "Chat", subtitle: "Chat subtitle" },
			input: {
				placeholder: { default: "Type...", typing: "Typing..." },
				sendButton: { text: "Send" },
			},
			messages: {
				initial: { id: "1", text: "Hi", quickReplies: ["Hello"] },
				placeholder: { text: "Placeholder", quickReplies: [] },
			},
		},
		footer: { title: "Footer", description: "Footer desc" },
		socials: [
			{
				key: "github",
				alt: "GitHub",
				href: "https://github.com",
				src: "github.png",
			},
		],
		navigation: {
			screenTypes: { first: "first", middle: "middle", footer: "footer" },
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it("throws ContentConfigError when CONTENT_CONFIG_PATH is not set", async () => {
		delete process.env.CONTENT_CONFIG_PATH;

		await expect(getContentConfig()).rejects.toThrow(ContentConfigError);
		await expect(getContentConfig()).rejects.toThrow(
			"CONTENT_CONFIG_PATH is not set",
		);
	});

	it("throws ContentConfigLoadError when config loading fails", async () => {
		process.env.CONTENT_CONFIG_PATH = "/test/path";
		const loadError = new Error("File not found");
		mockConfigLoader.mockImplementation((_, errorHandler) => {
			errorHandler(loadError, { configPath: "/test/path" });
		});

		await expect(getContentConfig()).rejects.toThrow(ContentConfigLoadError);
		await expect(getContentConfig()).rejects.toThrow(
			"Failed to load config from /test/path",
		);
	});

	it("throws ContentConfigParseError when config parsing fails", async () => {
		process.env.CONTENT_CONFIG_PATH = "/test/path";
		const parseError = new Error("Invalid config");
		mockConfigLoader.mockReturnValue("invalid config");
		mockConfigParser.mockImplementation((_, __, errorHandler) => {
			errorHandler(parseError, {
				schema: {} as unknown as z.ZodTypeAny,
				rawData: {},
			});
		});

		await expect(getContentConfig()).rejects.toThrow(ContentConfigParseError);
		await expect(getContentConfig()).rejects.toThrow(
			"Failed to parse content config",
		);
	});

	it("returns parsed config when everything succeeds", async () => {
		process.env.CONTENT_CONFIG_PATH = "/test/path";
		mockConfigLoader.mockReturnValue("raw config");
		mockConfigParser.mockReturnValue(mockConfig);

		const result = await getContentConfig();

		expect(result).toEqual(mockConfig);
		expect(mockConfigLoader).toHaveBeenCalledWith(
			"/test/path",
			expect.any(Function),
		);
		expect(mockConfigParser).toHaveBeenCalledWith(
			expect.any(Object),
			"raw config",
			expect.any(Function),
		);
	});
});
