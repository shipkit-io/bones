import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TEST_USER = {
	email: "test@shipkit.io",
	password: "shipkit",
};

export const STORAGE_STATE = path.join(__dirname, "../../test-results/.auth/user.json");

/**
 * Check if the storage state file contains real auth cookies (i.e. setup succeeded).
 */
export function isAuthenticated(): boolean {
	try {
		const data = JSON.parse(fs.readFileSync(STORAGE_STATE, "utf-8"));
		return data.cookies && data.cookies.length > 0;
	} catch {
		return false;
	}
}

/**
 * Check if the credentials form (email/password) is available on the sign-in page.
 */
export async function hasCredentialsForm(page: Page): Promise<boolean> {
	const emailField = page.getByLabel("Email");
	try {
		await emailField.waitFor({ state: "visible", timeout: 10000 });
		return true;
	} catch {
		return false;
	}
}

/**
 * Login helper: navigates to /sign-in, fills credentials, and waits for redirect.
 * Returns true if login succeeded, false if credentials form wasn't available.
 */
export async function login(page: Page, email: string, password: string): Promise<boolean> {
	await page.goto("/sign-in");

	// Wait for page to settle
	await page.waitForLoadState("networkidle");

	const hasForm = await hasCredentialsForm(page);
	if (!hasForm) {
		console.warn(
			"Credentials form not found on /sign-in. " +
				"Ensure NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED is true " +
				"(requires DATABASE_URL + PAYLOAD_SECRET)."
		);
		return false;
	}

	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password").fill(password);
	await page.getByRole("button", { name: /sign in/i }).click();

	// Wait for navigation away from sign-in
	await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 15000 });
	return true;
}

export const TEST_PROJECT_PREFIX = "e2e-test";

export function generateProjectName(): string {
	return `${TEST_PROJECT_PREFIX}-${Date.now()}`;
}
