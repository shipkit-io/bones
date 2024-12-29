import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import {
	checkGitHubUsername,
	getRepoStars,
	grantGitHubAccess,
	revokeGitHubAccess,
} from "@/server/services/github/github-service";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const TEST_USER = {
	email: "lacy@shipkit.io",
	githubUsername: "lacy-rvo",
};

describe("GitHub Service", () => {
	let userId: string;

	beforeAll(async () => {
		// Verify the test user exists on GitHub
		const exists = await checkGitHubUsername(TEST_USER.githubUsername);
		expect(exists).toBe(true);

		// Create test user in database
		const createdUsers = await db
			.insert(users)
			.values({
				email: TEST_USER.email,
				githubUsername: TEST_USER.githubUsername,
			})
			.returning();

		const user = createdUsers[0];
		if (!user) throw new Error("Failed to create test user");
		userId = user.id;
	});

	afterAll(async () => {
		// Clean up test user
		if (userId) {
			await db.delete(users).where(eq(users.id, userId));
		}
	});

	describe("getRepoStars", () => {
		test("should return star count for a repository", async () => {
			const stars = await getRepoStars();
			expect(typeof stars).toBe("number");
			expect(stars).toBeGreaterThanOrEqual(0);
		});
	});

	describe("grantGitHubAccess", () => {
		test("should grant access to a user", async () => {
			const result = await grantGitHubAccess({
				email: TEST_USER.email,
				githubUsername: TEST_USER.githubUsername,
				accessToken: process.env.GITHUB_ACCESS_TOKEN!,
			});
			expect(result).toBe(true);
		});

		test("should throw error if username is missing", async () => {
			await expect(
				grantGitHubAccess({
					email: TEST_USER.email,
					githubUsername: "",
					accessToken: process.env.GITHUB_ACCESS_TOKEN!,
				}),
			).rejects.toThrow("GitHub username is required");
		});

		test("should throw error if access token is missing", async () => {
			await expect(
				grantGitHubAccess({
					email: TEST_USER.email,
					githubUsername: TEST_USER.githubUsername,
					accessToken: "",
				}),
			).rejects.toThrow("GitHub access token is required");
		});
	});

	describe("revokeGitHubAccess", () => {
		test("should revoke access from a user", async () => {
			await expect(revokeGitHubAccess(userId)).resolves.not.toThrow();
		});

		test("should handle non-existent user gracefully", async () => {
			await expect(revokeGitHubAccess("nonexistent-id")).resolves.not.toThrow();
		});
	});
});
