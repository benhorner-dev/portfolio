import { expect, test } from "@chromatic-com/playwright";

const PERFORMANCE_THRESHOLDS = {
	LCP_MAX_MS: 2500,
	INP_MAX_MS: 200,
	CLS_MAX: 0.1,
	TTFB_MAX_MS: 600,
	FCP_MAX_MS: 1800,
	TBT_MAX_MS: 200,
	IMAGE_MAX_PX: 2000,
	EXTERNAL_SCRIPTS_MAX: 50,
	DOM_NODES_MAX: 1000,
	DOM_DEPTH_MAX: 15,
} as const;

test("should load portfolio without errors", async ({ page }) => {
	await page.goto("/");

	await expect(page.locator("#hero")).toBeVisible();
	await expect(page.locator("#explore")).toBeVisible();
	await expect(page.locator("#contact")).toBeVisible();

	await expect(page.locator('input[placeholder*="Type"]')).toBeVisible();

	const consoleErrors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") {
			consoleErrors.push(msg.text());
		}
	});

	expect(consoleErrors).toHaveLength(0);
});

test("should meet Core Web Vitals thresholds", async ({ page }) => {
	await page.goto("/");

	const lcp = await page.evaluate(() => {
		return new Promise<number>((resolve) => {
			const timeout = setTimeout(() => resolve(0), 5000);

			new PerformanceObserver((list) => {
				const entries = list.getEntries();
				if (entries.length > 0) {
					const lastEntry = entries[entries.length - 1];
					clearTimeout(timeout);
					resolve(lastEntry.startTime);
				}
			}).observe({ entryTypes: ["largest-contentful-paint"] });
		});
	});

	expect(lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.LCP_MAX_MS);

	const inp = await page.evaluate(() => {
		return new Promise<number>((resolve) => {
			const timeout = setTimeout(() => resolve(0), 5000);

			new PerformanceObserver((list) => {
				const entries = list.getEntries();
				if (entries.length > 0) {
					const lastEntry = entries[
						entries.length - 1
					] as PerformanceEventTiming;
					clearTimeout(timeout);
					resolve(lastEntry.duration);
				}
			}).observe({ entryTypes: ["interaction"] });
		});
	});

	expect(inp).toBeLessThan(PERFORMANCE_THRESHOLDS.INP_MAX_MS);

	const cls = await page.evaluate(() => {
		return new Promise<number>((resolve) => {
			const timeout = setTimeout(() => resolve(0), 5000);
			let clsValue = 0;

			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					const layoutShiftEntry = entry as unknown as {
						hadRecentInput: boolean;
						value: number;
					};
					if (!layoutShiftEntry.hadRecentInput) {
						clsValue += layoutShiftEntry.value;
					}
				}
				clearTimeout(timeout);
				resolve(clsValue);
			}).observe({ entryTypes: ["layout-shift"] });
		});
	});

	expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.CLS_MAX);

	const ttfb = await page.evaluate(() => {
		const navigation = performance.getEntriesByType(
			"navigation",
		)[0] as PerformanceNavigationTiming;
		return navigation.responseStart - navigation.requestStart;
	});

	expect(ttfb).toBeLessThan(PERFORMANCE_THRESHOLDS.TTFB_MAX_MS);

	const fcp = await page.evaluate(() => {
		return new Promise<number>((resolve) => {
			const timeout = setTimeout(() => resolve(0), 5000);

			if (document.readyState === "complete") {
				const navigation = performance.getEntriesByType(
					"navigation",
				)[0] as PerformanceNavigationTiming;
				const fcp = navigation.domContentLoadedEventEnd - navigation.fetchStart;
				clearTimeout(timeout);
				resolve(fcp);
			} else {
				window.addEventListener("load", () => {
					const navigation = performance.getEntriesByType(
						"navigation",
					)[0] as PerformanceNavigationTiming;
					const fcp =
						navigation.domContentLoadedEventEnd - navigation.fetchStart;
					clearTimeout(timeout);
					resolve(fcp);
				});
			}
		});
	});

	expect(fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.FCP_MAX_MS);

	const tbt = await page.evaluate(() => {
		return new Promise<number>((resolve) => {
			const timeout = setTimeout(() => resolve(0), 5000);
			let totalBlockingTime = 0;

			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					const longTaskEntry = entry as unknown as { duration: number };
					if (longTaskEntry.duration > 50) {
						totalBlockingTime += longTaskEntry.duration - 50;
					}
				}
				clearTimeout(timeout);
				resolve(totalBlockingTime);
			}).observe({ entryTypes: ["longtask"] });
		});
	});

	expect(tbt).toBeLessThan(PERFORMANCE_THRESHOLDS.TBT_MAX_MS);
});

test("should meet resource and accessibility thresholds", async ({ page }) => {
	await page.goto("/");

	const imageSizes = await page.evaluate(() => {
		const images = document.querySelectorAll("img");
		return Array.from(images).map((img) => ({
			src: img.src,
			naturalWidth: img.naturalWidth,
			naturalHeight: img.naturalHeight,
		}));
	});

	imageSizes.forEach((img) => {
		expect(img.naturalWidth).toBeLessThan(PERFORMANCE_THRESHOLDS.IMAGE_MAX_PX);
		expect(img.naturalHeight).toBeLessThan(PERFORMANCE_THRESHOLDS.IMAGE_MAX_PX);
	});

	const jsSize = await page.evaluate(() => {
		const scripts = document.querySelectorAll("script[src]");
		return Array.from(scripts).reduce((total, script) => {
			const src = script.getAttribute("src");
			if (src && !src.includes("localhost")) {
				return total + 1;
			}
			return total;
		}, 0);
	});

	expect(jsSize).toBeLessThan(PERFORMANCE_THRESHOLDS.EXTERNAL_SCRIPTS_MAX);

	const domSize = await page.evaluate(
		() => document.querySelectorAll("*").length,
	);
	expect(domSize).toBeLessThan(PERFORMANCE_THRESHOLDS.DOM_NODES_MAX);

	const maxDepth = await page.evaluate(() => {
		function getMaxDepth(element: Element, currentDepth = 0): number {
			const children = Array.from(element.children);
			if (children.length === 0) return currentDepth;

			return Math.max(
				...children.map((child) => getMaxDepth(child, currentDepth + 1)),
			);
		}

		return getMaxDepth(document.body);
	});

	expect(maxDepth).toBeLessThan(PERFORMANCE_THRESHOLDS.DOM_DEPTH_MAX);
});
