import { expect, test } from "@playwright/test";

test("has text", async ({ page }) => {
	await page.goto("http://localhost:3000");

	await expect(page.getByText(/Hello World/)).toBeVisible();
});
