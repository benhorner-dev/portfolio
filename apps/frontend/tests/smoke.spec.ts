import { expect, test } from "@chromatic-com/playwright";

test("has text", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByText(/Hello World/)).toBeVisible();
});
