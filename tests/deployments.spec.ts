import { expect, test } from "@playwright/test";

test.describe("Deployments Page", () => {
	test("should redirect to sign-in if not logged in", async ({ page }) => {
		await page.goto("/deployments");
		await expect(page).toHaveURL(/sign-in/);
	});

	test.describe("when logged in", () => {
		test.beforeEach(async ({ page }) => {
			// You'll need to implement a way to mock authentication
			// For example, by setting a session cookie
			// This is a placeholder for your auth logic
			await page.goto("/");
			await page.evaluate(() => {
				window.localStorage.setItem("next-auth.session-token", "your-mock-session-token");
			});
			await page.goto("/deployments");
		});

		test("should display the deployments page", async ({ page }) => {
			await expect(page.locator("h1")).toHaveText("Deployments");
		});

		test("should open the deploy dialog", async ({ page }) => {
			await page.click('button:has-text("Deploy to Vercel")');
			await expect(page.locator("h2")).toContainText("Deploy");
		});

		test("should show an error if project name is missing", async ({ page }) => {
			await page.click('button:has-text("Deploy to Vercel")');
			await page.click('button:has-text("Deploy Now")');
			await expect(page.locator("text=Please enter a project name")).toBeVisible();
		});

		test("should initiate a deployment", async ({ page }) => {
			await page.click('button:has-text("Deploy to Vercel")');
			await page.fill("input[name=projectName]", "my-test-app");
			await page.click('button:has-text("Deploy Now")');

			// The toast library might need specific locators
			await expect(page.locator("text=Deployment initiated successfully!")).toBeVisible();
		});
	});
});
