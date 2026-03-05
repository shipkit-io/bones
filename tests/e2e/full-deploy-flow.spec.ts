/**
 * Full Deployment Lifecycle E2E Test
 *
 * Exercises: Login → Dashboard → Verify Connections → Deploy → Monitor → Validate → Delete
 *
 * Requires env vars:
 *   TEST_GITHUB_TOKEN   - GitHub PAT with repo+workflow scope
 *   TEST_GITHUB_USERNAME - GitHub username
 *   TEST_VERCEL_TOKEN    - Vercel API token
 *   TEST_VERCEL_USER_ID  - Vercel user ID (from GET /v2/user)
 *
 * Skips gracefully if any are missing.
 */
import { expect, test } from "@playwright/test";
import { generateProjectName, isAuthenticated, login, TEST_PROJECT_PREFIX, TEST_USER } from "./fixtures";
import { cleanupDeployment, closeDb as closeCleanupDb } from "./helpers/cleanup-deployment";
import {
	cleanupConnections,
	closeDb as closeSeedDb,
	getTestUserId,
	seedGitHubConnection,
	seedVercelConnection,
} from "./helpers/seed-connections";

const GITHUB_TOKEN = process.env.TEST_GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.TEST_GITHUB_USERNAME;
const VERCEL_TOKEN = process.env.TEST_VERCEL_TOKEN;
const VERCEL_USER_ID = process.env.TEST_VERCEL_USER_ID;

const hasDeployEnv = !!(GITHUB_TOKEN && GITHUB_USERNAME && VERCEL_TOKEN && VERCEL_USER_ID);

// State shared across the test
let testUserId: string;
let projectName: string;
let vercelProjectId: string | undefined;
let seeded = false;

test.describe("Full Deployment Flow", () => {
	test.beforeEach(() => {
		test.skip(!hasDeployEnv, "Deploy env vars not set — skipping deployment flow tests");
		test.skip(!isAuthenticated(), "Credentials auth not available — skipping authenticated tests");
	});

	test.beforeAll(async () => {
		if (!hasDeployEnv || !isAuthenticated()) return;

		// Seed connections
		testUserId = await getTestUserId(TEST_USER.email);
		await seedGitHubConnection(testUserId, GITHUB_TOKEN!, GITHUB_USERNAME!);
		await seedVercelConnection(testUserId, VERCEL_TOKEN!, VERCEL_USER_ID!);

		projectName = generateProjectName();
		seeded = true;
	});

	test.afterAll(async () => {
		if (!seeded || !testUserId) return;

		// Always cleanup, even on failure
		try {
			await cleanupDeployment({
				githubOwner: GITHUB_USERNAME!,
				githubRepoName: projectName,
				vercelProjectId,
				userId: testUserId,
				projectNamePrefix: TEST_PROJECT_PREFIX,
			});
		} catch (err) {
			console.warn("Cleanup error (non-fatal):", err);
		}

		try {
			await cleanupConnections(testUserId);
		} catch (err) {
			console.warn("Connection cleanup error (non-fatal):", err);
		}

		// Close DB connections
		await closeSeedDb();
		await closeCleanupDb();
	});

	test("full deployment lifecycle", async ({ page }) => {
		// 5 minute timeout for the full deployment flow
		test.setTimeout(5 * 60 * 1000);

		// Step 1: Login
		const loggedIn = await login(page, TEST_USER.email, TEST_USER.password);
		expect(loggedIn).toBe(true);

		// Step 2: Dashboard
		await page.goto("/dashboard");
		await expect(page.getByText(/hello/i)).toBeVisible({ timeout: 15000 });

		// Step 3: Verify connections show as connected
		await page.goto("/settings/account");
		await expect(page.getByText(/view repository/i)).toBeVisible({ timeout: 15000 });
		await expect(page.getByText(/view vercel dashboard/i)).toBeVisible({ timeout: 15000 });

		// Step 4: Navigate to deployments
		await page.goto("/deployments");
		await expect(page.getByText(/deployments/i).first()).toBeVisible({ timeout: 15000 });

		// Step 5: Start deployment
		const deployButton = page.getByRole("button", { name: /deploy to vercel/i });
		await expect(deployButton).toBeVisible({ timeout: 10000 });
		await deployButton.click();

		// Fill in project name and wait for validation
		const nameInput = page.locator("#projectName");
		await expect(nameInput).toBeVisible({ timeout: 5000 });
		await nameInput.fill(projectName);

		// Wait for validation to complete (either "Name available" or "Valid format")
		await expect(
			page.getByText(/name available|valid format/i),
		).toBeVisible({ timeout: 10000 });

		// Click Deploy Now
		const deployNowButton = page.getByRole("button", { name: /deploy now/i });
		await expect(deployNowButton).toBeEnabled({ timeout: 5000 });
		await deployNowButton.click();

		// Step 6: Deployment initiated
		await expect(page.getByText(/deployment started/i)).toBeVisible({ timeout: 30000 });

		// Click "View Deployments" to go to the deployments list
		const viewDeploymentsLink = page.getByRole("link", { name: /view deployments/i });
		await expect(viewDeploymentsLink).toBeVisible({ timeout: 5000 });
		await viewDeploymentsLink.click();

		// Wait for navigation to deployments page
		await page.waitForURL(/\/deployments/, { timeout: 10000 });

		// Verify our deployment appears in the list
		await expect(page.getByText(projectName)).toBeVisible({ timeout: 15000 });

		// Step 7: Monitor — poll until status changes from "deploying" (up to 4 minutes)
		const maxWait = 4 * 60 * 1000;
		const pollInterval = 5000;
		const startTime = Date.now();

		let deploymentCompleted = false;

		while (Date.now() - startTime < maxWait) {
			// The deployments list auto-polls via React Query, so just check the page
			const completedBadge = page.locator(`tr:has-text("${projectName}") >> text=completed`);
			const failedBadge = page.locator(`tr:has-text("${projectName}") >> text=failed`);

			const isCompleted = await completedBadge.isVisible().catch(() => false);
			const isFailed = await failedBadge.isVisible().catch(() => false);

			if (isCompleted) {
				deploymentCompleted = true;
				break;
			}

			if (isFailed) {
				// Get error text if available
				const errorText = await page
					.locator(`tr:has-text("${projectName}") >> text=Error:`)
					.textContent()
					.catch(() => "unknown error");
				throw new Error(`Deployment failed: ${errorText}`);
			}

			// Wait before checking again
			await page.waitForTimeout(pollInterval);
		}

		expect(deploymentCompleted).toBe(true);

		// Step 8: Validate — extract deployment URL and verify it loads
		const deploymentRow = page.locator(`tr:has-text("${projectName}")`);
		const deploymentLink = deploymentRow.locator('a[title="View deployment"]');

		if (await deploymentLink.isVisible().catch(() => false)) {
			const deploymentUrl = await deploymentLink.getAttribute("href");
			if (deploymentUrl) {
				// Fetch the deployment URL and check it returns < 500
				const response = await page.request.get(deploymentUrl);
				expect(response.status()).toBeLessThan(500);
			}
		}

		// Extract vercelProjectId from the Vercel project link for cleanup
		const vercelProjectLink = deploymentRow.locator('a[title="View on Vercel"]');
		if (await vercelProjectLink.isVisible().catch(() => false)) {
			const vercelUrl = await vercelProjectLink.getAttribute("href");
			// URL format: https://vercel.com/{user}/{project}
			if (vercelUrl) {
				const parts = vercelUrl.split("/");
				vercelProjectId = parts[parts.length - 1];
			}
		}

		// Step 9: Delete — click row menu → Delete → Confirm
		const actionsButton = deploymentRow.locator('[data-testid="deployment-actions-trigger"]');
		await actionsButton.click();

		const deleteMenuItem = page.locator('[data-testid="deployment-actions-delete"]');
		await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });
		await deleteMenuItem.click();

		// Confirm deletion in the alert dialog
		const confirmDeleteButton = page.locator('[data-testid="deployment-actions-confirm-delete"]');
		await expect(confirmDeleteButton).toBeVisible({ timeout: 5000 });
		await confirmDeleteButton.click();

		// Verify the deployment row is removed
		await expect(page.getByText(projectName)).not.toBeVisible({ timeout: 10000 });
	});
});
