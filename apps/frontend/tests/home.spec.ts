import { expect, test } from "@chromatic-com/playwright";

test("has text", async ({ page }) => {
	await page.goto("http://localhost:3000");

	await expect(page.getByText(/Hello World/)).toBeVisible();
});
