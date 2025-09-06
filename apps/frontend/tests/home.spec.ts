import { expect, test } from "@chromatic-com/playwright";

test.describe("Portfolio E2E Test - Complete User Journey", () => {
	test("should complete full user journey: unauthenticated → login → authenticated features → logout", async ({
		page,
		context,
	}) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		await expect(page.locator("#hero")).toBeVisible();
		await expect(page.locator("#hero h1")).toContainText(
			"Welcome to Ben Horner's portfolio",
		);

		const protectedContent = page.locator('[data-auth-required="true"]');
		await expect(protectedContent).not.toBeVisible();

		const loginButton = page
			.locator('a:has-text("Login"), a:has-text("Sign In")')
			.first();
		await expect(loginButton).toBeVisible();
		await loginButton.click();

		await page.waitForURL(/benhorner-portfolio\.au\.auth0\.com/, {
			timeout: 10000,
		});

		await page.fill(
			'input[name="email"], input[name="username"]',
			process.env.TEST_EMAIL || "",
		);
		await page.fill('input[name="password"]', process.env.TEST_PASSWORD || "");
		await page.click('button[type="submit"], button[name="submit"]');

		await page.waitForURL(/^((?!auth0).)*$/, { timeout: 15000 });
		await page.waitForLoadState("networkidle");

		await expect(page.locator("#hero")).toBeVisible();
		await expect(page.locator("#hero h1")).toContainText(
			"Welcome to Ben Horner's portfolio",
		);

		const ctaButton = page.locator('a[href="#explore"] button');
		await expect(ctaButton).toBeVisible();
		await ctaButton.click();

		await expect(page.locator("#explore")).toBeVisible();
		const exploreTitle = page.getByRole("heading", {
			name: "Explore Ben's work",
		});
		await expect(exploreTitle).toBeVisible();

		const chatInput = page.locator('input[placeholder*="Type"]');
		await expect(chatInput).toBeVisible();
		await expect(chatInput).toBeEnabled();

		await chatInput.fill("Hello, this is a test message");
		await expect(chatInput).toHaveValue("Hello, this is a test message");

		const sendButton = page.locator('button:has-text("Send")');
		await expect(sendButton).toBeVisible();
		await sendButton.click();

		await expect(
			page.locator("text=Hello, this is a test message"),
		).toBeVisible();

		await expect(page.locator('input[placeholder*="typing"]')).toBeVisible({
			timeout: 2000,
		});

		const typingIndicator = page.locator(".animate-bounce").first();
		await expect(typingIndicator).toBeVisible({ timeout: 5000 });

		await expect(page.locator("text=test question three")).toBeVisible({
			timeout: 8000,
		});
		await expect(page.locator('input[placeholder*="Type"]')).toBeVisible();

		const quickReplies = page.locator("text=Tell me about your projects");
		await expect(quickReplies.first()).toBeVisible({ timeout: 2000 });

		await quickReplies.first().click();

		await expect(
			page
				.locator('div[class*="justify-end"]')
				.filter({ hasText: "Tell me about your projects" }),
		).toBeVisible();

		await page.waitForTimeout(500);
		await expect(page.locator(".animate-bounce").first()).toBeVisible({
			timeout: 5000,
		});

		await page.waitForTimeout(4000);

		const chatInputAfterQuickReply = page.locator('input[placeholder*="Type"]');
		await expect(chatInputAfterQuickReply).toBeEnabled();

		await chatInputAfterQuickReply.fill("Message sent with Enter key");
		await chatInputAfterQuickReply.press("Enter");

		await expect(
			page.locator("text=Message sent with Enter key"),
		).toBeVisible();

		await page.locator('nav a[href="#contact"]').click();
		await expect(page.locator("#contact")).toBeVisible();
		await expect(page.locator("#contact h1")).toContainText("Let's Connect");

		const githubLink = page.locator('a[href*="github"]');
		const linkedinLink = page.locator('a[href*="linkedin"]');

		await expect(githubLink).toBeVisible();
		await expect(linkedinLink).toBeVisible();

		const githubPagePromise = context.waitForEvent("page");
		await githubLink.click();
		const githubPage = await githubPagePromise;
		await expect(githubPage.url()).toContain("github.com");
		await githubPage.close();

		const linkedinPagePromise = context.waitForEvent("page");
		await linkedinLink.click();
		const linkedinPage = await linkedinPagePromise;
		await expect(linkedinPage.url()).toContain("linkedin.com");
		await linkedinPage.close();

		await page.locator('nav a[href="#hero"]').click();
		await expect(page.locator("#hero")).toBeVisible();

		const logoutButton = page
			.locator('a:has-text("Logout"), a:has-text("Sign Out")')
			.first();
		await expect(logoutButton).toBeVisible({ timeout: 10000 });

		await logoutButton.click();

		await page.waitForLoadState("networkidle");
		const loginButtonAfterLogout = page
			.locator('a:has-text("Login"), a:has-text("Sign In")')
			.first();
		await expect(loginButtonAfterLogout).toBeVisible({ timeout: 10000 });

		const protectedContentAfterLogout = page.locator(
			'[data-auth-required="true"]',
		);
		await expect(protectedContentAfterLogout).not.toBeVisible();
	});
});
