import { siteConfig } from "@/config/site";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { Octokit } from "@octokit/rest";
import { eq } from "drizzle-orm";
import { cache } from "react";

// Ensure token exists
if (!env?.GITHUB_ACCESS_TOKEN) {
	logger.error("GITHUB_ACCESS_TOKEN is required");
}

// Create an Octokit instance with the admin token
export const octokit = new Octokit({
	auth: env.GITHUB_ACCESS_TOKEN,
});

logger.info("Initialized GitHub service with admin token", {
	hasToken: true,
	repoOwner: siteConfig.repo.owner,
	repoName: siteConfig.repo.name,
});

interface GitHubAccessParams {
	email: string;
	githubUsername: string;
	accessToken: string;
}

// Cache for 5 minutes
export const getRepo = cache(async (owner?: string, repo?: string) => {
	try {
		// Use provided values or fall back to siteConfig defaults
		const repoOwner = owner || siteConfig.repo.owner;
		const repoName = repo || siteConfig.repo.name;

		const response = await octokit.rest.repos.get({
			owner: repoOwner,
			repo: repoName,
		});

		return response.data;
	} catch (error) {
		logger.error("Error fetching GitHub stars:", error);
		return null;
	}
});

/**
 * Grants access to the private repository for a GitHub user
 */
export async function grantGitHubAccess({
	email,
	githubUsername,
	accessToken,
}: GitHubAccessParams) {
	logger.info("Starting GitHub access grant", {
		email,
		githubUsername,
		hasAccessToken: !!accessToken,
	});

	if (!env?.GITHUB_ACCESS_TOKEN) {
		logger.error("GitHub access token missing");
		return;
	}

	if (!githubUsername) {
		logger.error("GitHub username missing");
		throw new Error("GitHub username is required");
	}

	if (!accessToken) {
		logger.error("GitHub access token missing");
		throw new Error("GitHub access token is required");
	}

	try {
		// Verify admin token first
		try {
			const { data: adminUser } = await octokit.rest.users.getAuthenticated();
			const scopes = await getTokenScopes(env.GITHUB_ACCESS_TOKEN);

			logger.info("Admin token verified", {
				adminUsername: adminUser.login,
				scopes,
				hasRepoScope: scopes.includes("repo"),
			});

			if (!scopes.includes("repo")) {
				throw new Error("Admin token missing 'repo' scope");
			}
		} catch (error) {
			logger.error("Admin token verification failed", {
				error,
				errorMessage: error instanceof Error ? error.message : "Unknown error",
			});
			throw new Error("Invalid admin token configuration");
		}

		// Check if user already has access using admin token
		logger.info("Checking existing repository access", {
			githubUsername,
			repository: `${siteConfig.repo.owner}/${siteConfig.repo.name}`,
		});

		try {
			const { data: collaborator } =
				await octokit.rest.repos.getCollaboratorPermissionLevel({
					owner: siteConfig.repo.owner,
					repo: siteConfig.repo.name,
					username: githubUsername,
				});

			logger.info("Retrieved collaborator permission level", {
				githubUsername,
				permission: collaborator.permission,
			});

			if (
				collaborator.permission === "admin" ||
				collaborator.permission === "write" ||
				collaborator.permission === "read"
			) {
				logger.info("User already has repository access", {
					githubUsername,
					permission: collaborator.permission,
				});
				return true;
			}
		} catch (error) {
			// 404 is expected if user is not a collaborator yet
			if (error instanceof Error && !error.message.includes("Not Found")) {
				throw error;
			}
			logger.info("User is not a collaborator yet", { githubUsername });
		}

		// Verify user token has correct scopes
		const userScopes = await getTokenScopes(accessToken);
		logger.info("Verifying user token", {
			githubUsername,
			scopes: userScopes,
			hasRepoScope: userScopes.includes("repo"),
		});

		if (!userScopes.includes("repo")) {
			throw new Error("User token missing 'repo' scope");
		}

		const userOctokit = new Octokit({
			auth: accessToken,
		});

		const { data: user } = await userOctokit.rest.users.getAuthenticated();

		logger.info("User token verified", {
			providedUsername: githubUsername,
			authenticatedUsername: user.login,
		});

		const payload = {
			owner: siteConfig.repo.owner,
			repo: siteConfig.repo.name,
			username: githubUsername,
			permission: "read",
		};

		// Add user as collaborator with write access using admin token
		logger.info("Adding user as repository collaborator", payload);

		await octokit.rest.repos.addCollaborator(payload);

		logger.info("Successfully added user as repository collaborator", payload);

		return true;
	} catch (error) {
		logger.error("Error granting GitHub access", {
			error,
			githubUsername,
			email,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
			errorStack: error instanceof Error ? error.stack : undefined,
		});
		throw error;
	}
}

/**
 * Revokes GitHub access for a user, with safeguards to prevent dangerous operations
 */
export async function revokeGitHubAccess(userId: string) {
	try {
		// Get user details including their GitHub token and username
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				id: true,
				githubUsername: true,
				email: true,
			},
		});

		if (!user?.githubUsername) {
			logger.warn("No GitHub username found for user", { userId });
			return;
		}

		if (siteConfig.repo.owner === user.githubUsername) {
			throw new Error("Cannot revoke access for repository owner");
		}

		// Check if user has active deployments or critical operations
		const hasActiveDeployments = await checkActiveDeployments(
			user.githubUsername,
		);
		if (hasActiveDeployments) {
			throw new Error("Cannot revoke access while user has active deployments");
		}

		// Remove user as collaborator using admin token
		await octokit.rest.repos.removeCollaborator({
			owner: siteConfig.repo.owner,
			repo: siteConfig.repo.name,
			username: user.githubUsername,
		});

		// Update user record
		await db
			.update(users)
			.set({
				githubUsername: null,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		logger.info("Successfully revoked GitHub access", {
			userId,
			githubUsername: user.githubUsername,
		});
	} catch (error) {
		logger.error("Failed to revoke GitHub access", {
			userId,
			error: error instanceof Error ? error.message : "Unknown error",
		});
		throw error;
	}
}

/**
 * Checks if a GitHub user has any active deployments or critical operations
 */
async function checkActiveDeployments(
	githubUsername: string,
): Promise<boolean> {
	if (!env?.GITHUB_ACCESS_TOKEN) {
		logger.error("GITHUB_ACCESS_TOKEN is not set in the environment.");
		return false;
	}

	try {
		const octokit = new Octokit({
			auth: env.GITHUB_ACCESS_TOKEN,
		});

		// Check deployments
		const { data: deployments } = await octokit.rest.repos.listDeployments({
			owner: siteConfig.repo.owner,
			repo: siteConfig.repo.name,
			per_page: 100,
		});

		const activeDeployments = deployments.filter(
			(deployment: any) => deployment.creator?.login === githubUsername,
		);

		return activeDeployments.length > 0;
	} catch (error) {
		logger.error("Failed to check active deployments", {
			githubUsername,
			error: error instanceof Error ? error.message : "Unknown error",
		});
		return false;
	}
}

/**
 * Get OAuth token scopes
 */
async function getTokenScopes(token: string): Promise<string[]> {
	try {
		const tempOctokit = new Octokit({ auth: token });
		const { headers } = await tempOctokit.request("GET /user");
		return headers["x-oauth-scopes"]?.split(", ") ?? [];
	} catch (error) {
		logger.error("Error getting token scopes", { error });
		return [];
	}
}

/**
 * Check if a GitHub username exists
 */
export async function checkGitHubUsername(username: string): Promise<boolean> {
	logger.info("Checking if GitHub username exists", { username });

	try {
		await octokit.rest.users.getByUsername({
			username,
		});
		logger.info("GitHub username exists", { username });
		return true;
	} catch (error) {
		logger.error("Error checking GitHub username", {
			error,
			username,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
		});
		return false;
	}
}

/**
 * Check if a user has connected their GitHub account
 */
export async function checkGitHubConnection(userId: string): Promise<boolean> {
	logger.info("Checking GitHub connection", { userId });

	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.then((rows: any) => rows[0]);

	const hasGitHubConnection = Boolean(user?.githubUsername);

	logger.info("GitHub connection status", {
		userId,
		hasGitHubConnection,
		githubUsername: user?.githubUsername,
	});

	return hasGitHubConnection;
}

// Cache the star count for 5 minutes to avoid hitting GitHub's rate limits
export const getRepoStars = cache(
	async ({
		owner = siteConfig.repo.owner,
		repo = siteConfig.repo.name,
	}: { owner?: string; repo?: string } = {}) => {
		try {
			const response = await getRepo(owner, repo);
			return response?.stargazers_count ?? 0;
		} catch (error) {
			logger.error("Error fetching GitHub stars:", error);
			return 0;
		}
	},
);
