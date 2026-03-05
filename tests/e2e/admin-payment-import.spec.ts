import { expect, test } from "@playwright/test";
import { routes } from "@/config/routes";

// Use provided credentials directly
const adminEmail = "test@shipkit.io";
const adminPassword = "shipkit";

test.describe("Admin Payment Import E2E Tests", () => {
	test("should allow admin to initiate payment import for all providers", async ({ page }) => {
		// 1. Login as Admin
		await page.goto(routes.auth.signIn);
		await page.getByLabel("Email").fill(adminEmail);
		await page.getByLabel("Password").fill(adminPassword);
		await page.getByRole("button", { name: /sign in/i }).click();

		// Check for login error toast *before* checking URL
		const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
		// Use a short timeout - if login succeeds, no error toast should appear quickly.
		// If it fails, the toast should appear relatively fast.
		try {
			await expect(errorToast).toBeVisible({ timeout: 5000 }); // Check for 5 seconds
			// If we get here, an error toast appeared - log it and fail fast
			const toastText = await errorToast.textContent();
			console.error(`Login failed with error toast: ${toastText}`);
			test.fail(true, `Login failed, error toast appeared: ${toastText}`);
			return; // Stop test execution
		} catch (e) {
			// No error toast found within the timeout, proceed with URL check
			console.log("No login error toast found, proceeding to URL check.");
		}

		// Wait for navigation to a post-login page (e.g., dashboard or admin)
		// Adjust the URL expectation based on your app's admin redirect logic
		await expect(page).toHaveURL(new RegExp(`${routes.app.dashboard}|${routes.admin.index}`), {
			timeout: 10000,
		});
		console.log(`Logged in as admin, current URL: ${page.url()}`);

		// 2. Navigate to Admin Payments Page
		await page.goto(routes.admin.payments);
		await expect(page).toHaveURL(routes.admin.payments);
		await expect(page.getByRole("heading", { name: "Payments" })).toBeVisible();
		console.log("Navigated to admin payments page");

		// 3. Locate and interact with the ImportPayments component
		//    (Selectors might need adjustment based on the actual component structure)

		// Find the container for the import functionality (assuming a data-testid or specific structure)
		const importSection = page.locator('section:has-text("Import Payments")'); // Adjust selector as needed
		await expect(importSection).toBeVisible();
		console.log("Import section located");

		// Select "All Providers" from a dropdown/select element
		// Assuming Shadcn combobox structure, adjust if different
		const providerSelect = importSection.getByRole("combobox"); // Adjust selector
		await expect(providerSelect).toBeVisible();
		await providerSelect.click(); // Open the dropdown
		await page.getByRole("option", { name: /all providers/i }).click(); // Select the 'all' option
		console.log('Selected "All Providers"');

		// Find and click the import button
		const importButton = importSection.getByRole("button", { name: /import payments/i }); // Adjust selector
		await expect(importButton).toBeVisible();
		await expect(importButton).toBeEnabled();
		await importButton.click();
		console.log("Clicked import button");

		// 4. Verify Success Feedback
		//    Check for a success toast message (using Sonner toast attributes)
		const successToast = page.locator('[data-sonner-toast][data-type="success"]');
		await expect(successToast).toBeVisible({ timeout: 20000 }); // Allow time for async action
		// Check for text indicating success - adjust regex as needed
		await expect(successToast).toContainText(
			/import process started|payments imported successfully/i
		);
		console.log("Success toast verified");

		// Optional: Wait for the toast to disappear or check for UI updates if applicable
	});
});
