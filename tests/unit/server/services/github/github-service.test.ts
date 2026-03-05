import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import {
	getRepoStars,
	grantGitHubAccess,
	revokeGitHubAccess,
} from "@/server/services/github/github-service";

const TEST_USER = {
	email: "lacy@shipkit.io",
	githubUsername: "lacy-rvo",
};

// Since we know the service is disabled in the test environment,
// we'll only test the disabled behavior
describe.skip("GitHub Service when disabled", () => {
	let userId: string;

	beforeAll(async () => {
		// Create test user in database
		const createdUsers = await db
			?.insert(users)
			.values({
				email: TEST_USER.email,
				githubUsername: TEST_USER.githubUsername,
			})
			.returning();

		const user = createdUsers?.[0];
		if (!user) throw new Error("Failed to create test user");
		userId = user.id;
	});

	afterAll(async () => {
		// Clean up test user
		if (userId) {
			await db?.delete(users).where(eq(users.id, userId));
		}
	});

	describe("getRepoStars", () => {
		test("should return 0 when service is disabled", async () => {
			const stars = await getRepoStars();
			expect(stars).toBe(0);
		});
	});

	describe("grantGitHubAccess", () => {
		test("should return false when service is disabled", async () => {
			const result = await grantGitHubAccess({
				githubUsername: TEST_USER.githubUsername,
			});
			expect(result).toBe(false);
		});

		test("should return false for missing username when disabled", async () => {
			const result = await grantGitHubAccess({
				githubUsername: "",
			});
			expect(result).toBe(false);
		});
	});

	describe("revokeGitHubAccess", () => {
		test("should return false when service is disabled", async () => {
			const result = await revokeGitHubAccess(userId);
			expect(result).toBe(false);
		});

		test("should return false for non-existent user when disabled", async () => {
			const result = await revokeGitHubAccess("nonexistent-id");
			expect(result).toBe(false);
		});
	});
});
