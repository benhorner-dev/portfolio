import { expect, test } from "@chromatic-com/playwright";

test.describe("Portfolio E2E Test - Complete User Journey", () => {
	test.describe("Unauthenticated User Tests", () => {
		test("should verify protected content is hidden when logged out", async ({
			page,
		}) => {
			await page.goto("/");

			await test.step("Verify protected features are not accessible", async () => {
				await expect(page.locator("#hero")).toBeVisible();

				const protectedContent = page.locator('[data-auth-required="true"]');
				await expect(protectedContent).not.toBeVisible();
			});
		});
	});

	test.describe("Authenticated User Tests", () => {
		test.beforeEach(async ({ page }) => {
			await test.step("Login with test user", async () => {
				await page.goto("/");

				const loginButton = page
					.locator('a:has-text("Login"), a:has-text("Sign In")')
					.first();
				await loginButton.click();

				await page.waitForURL(/benhorner-portfolio\.au\.auth0\.com/);

				await page.fill(
					'input[name="email"], input[name="username"]',
					process.env.TEST_EMAIL || "",
				);
				await page.fill(
					'input[name="password"]',
					process.env.TEST_PASSWORD || "",
				);
				await page.click('button[type="submit"], button[name="submit"]');

				await page.waitForURL(/^((?!auth0).)*$/);
				await page.waitForTimeout(1000);
			});
		});

		test("should complete full user journey through hero, explore, and contact sections", async ({
			page,
			context,
		}) => {
			await test.step("1. Verify hero section is visible and accessible", async () => {
				await expect(page.locator("#hero")).toBeVisible();
				await expect(page.locator("#hero h1")).toBeVisible();

				const heroTitle = page.locator("#hero h1");
				await expect(heroTitle).toContainText(
					"Welcome to Ben Horner's portfolio",
				);
			});

			await test.step("2. Test CTA button navigation to explore section", async () => {
				const ctaButton = page.locator('a[href="#explore"] button');
				await expect(ctaButton).toBeVisible();
				await ctaButton.click();

				await expect(page.locator("#explore")).toBeVisible();

				const exploreTitle = page.locator("#explore h2");
				await expect(exploreTitle).toBeVisible();
			});

			await test.step("3. Test chat functionality - send message and verify typing indicator", async () => {
				const chatInput = page.locator('input[placeholder*="Type"]');
				await expect(chatInput).toBeVisible();

				await chatInput.fill("Hello, this is a test message");
				await expect(chatInput).toHaveValue("Hello, this is a test message");

				const sendButton = page.locator('button:has-text("Send")');
				await expect(sendButton).toBeVisible();
				await sendButton.click();

				await expect(
					page.locator("text=Hello, this is a test message"),
				).toBeVisible();

				await page.waitForTimeout(100);
				await expect(
					page.locator('input[placeholder*="typing"]'),
				).toBeVisible();

				await page.waitForTimeout(200);
				await expect(page.locator(".animate-bounce").first()).toBeVisible({
					timeout: 10000,
				});

				await page.waitForTimeout(500);
			});

			await test.step("4. Wait for bot response and verify quick replies", async () => {
				await page.waitForTimeout(4000);

				await expect(page.locator("text=work!")).toBeVisible();

				await expect(page.locator('input[placeholder*="Type"]')).toBeVisible();
			});

			await test.step("5. Test quick reply functionality", async () => {
				const quickReplies = page.locator("text=Tell me about your projects");
				await expect(quickReplies).toHaveCount(2);

				const firstQuickReply = quickReplies.first();
				await firstQuickReply.click();

				await expect(
					page
						.locator('div[class*="justify-end"]')
						.filter({ hasText: "Tell me about your projects" }),
				).toBeVisible();

				await page.waitForTimeout(500);
				await expect(page.locator(".animate-bounce").first()).toBeVisible({
					timeout: 10000,
				});
			});

			await test.step("6. Test Enter key functionality for sending messages", async () => {
				await page.waitForTimeout(4000);

				const chatInput = page.locator('input[placeholder*="Type"]');
				await chatInput.fill("Message sent with Enter key");
				await chatInput.press("Enter");

				await expect(
					page.locator("text=Message sent with Enter key"),
				).toBeVisible();
			});

			await test.step("7. Test navigation to contact section", async () => {
				await page.locator('nav a[href="#contact"]').click();
				await expect(page.locator("#contact")).toBeVisible();

				const contactTitle = page.locator("#contact h1");
				await expect(contactTitle).toContainText("Let's Connect");
			});

			await test.step("8. Test social links open in new tabs", async () => {
				const githubLink = page.locator('a[href*="github"]');
				const linkedinLink = page.locator('a[href*="linkedin"]');

				await expect(githubLink).toBeVisible();
				await expect(linkedinLink).toBeVisible();

				const newPagePromise = context.waitForEvent("page");
				await githubLink.click();
				const githubPage = await newPagePromise;

				await expect(githubPage.url()).toContain("github.com");
				await githubPage.close();

				const linkedinPagePromise = context.waitForEvent("page");
				await linkedinLink.click();
				const linkedinPage = await linkedinPagePromise;

				await expect(linkedinPage.url()).toContain("linkedin.com");
				await linkedinPage.close();
			});

			await test.step("9. Test logo button returns to hero section", async () => {
				const logoButton = page.locator('nav a[href="#hero"]');
				await logoButton.click();

				const heroSection = page.locator("#hero");
				await expect(heroSection).toBeVisible();
			});

			await test.step("10. Test responsive design on mobile viewport", async () => {
				await page.setViewportSize({ width: 375, height: 667 });

				await expect(page.locator("nav")).toBeVisible();
				await expect(page.locator("#hero")).toBeVisible();

				await page.locator('a[href="#explore"] button').click();
				await expect(page.locator("#explore")).toBeVisible();
			});

			await test.step("11. Test accessibility features", async () => {
				await page.setViewportSize({ width: 1200, height: 800 });

				const logo = page.locator('nav svg[role="img"][aria-label="Logo"]');
				await expect(logo).toBeVisible();

				await page.locator('a[href="#contact"]').click();

				const socialImages = page.locator("#contact img");
				for (const img of await socialImages.all()) {
					const alt = await img.getAttribute("alt");
					expect(alt).toBeTruthy();
					expect(alt).not.toBe("");
				}
			});

			await test.step("12. Test smooth scrolling performance", async () => {
				const startTime = Date.now();

				await page.locator('a[href="#explore"] button').click();
				await expect(page.locator("#explore")).toBeVisible();

				const endTime = Date.now();
				const scrollTime = endTime - startTime;

				expect(scrollTime).toBeLessThan(3000);
			});

			await test.step("13. Debug: Check isTyping state", async () => {
				await page.locator('a[href="#explore"] button').click();

				const chatInput = page.locator('input[placeholder*="Type"]');
				await expect(chatInput).toBeVisible();

				console.log(
					"Initial input state:",
					await chatInput.getAttribute("disabled"),
				);

				await chatInput.fill("Debug message");
				await chatInput.press("Enter");

				await page.waitForTimeout(1000);

				console.log(
					"After sending message - input disabled:",
					await chatInput.getAttribute("disabled"),
				);
				console.log(
					"After sending message - placeholder:",
					await chatInput.getAttribute("placeholder"),
				);

				const typingIndicator = page.locator(".animate-bounce").first();
				if (await typingIndicator.isVisible()) {
					console.log("Typing indicator is visible");
				} else {
					console.log("Typing indicator is NOT visible");
				}
			});
		});

		test.afterEach(async ({ page }) => {
			await test.step("Logout", async () => {
				const logoutButton = page
					.locator('a:has-text("Logout"), a:has-text("Sign Out")')
					.first();
				if (await logoutButton.isVisible()) {
					await logoutButton.click();
					await page.waitForTimeout(1000);
				}
			});
		});
	});
});
