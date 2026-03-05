import { Octokit } from "@octokit/rest";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { siteConfig } from "@/config/site-config";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

/**
 * GitHub profile information with repository permissions
 */
export interface GitHubProfile {
	login: string;
	avatar_url: string;
	html_url: string;
	name: string;
	bio: string;
	company: string | null;
	blog: string;
	location: string | null;
	email: string | null;
	public_repos: number;
	followers: number;
	following: number;
	permission: string;
}

// Conditionally initialize Octokit
let octokit: Octokit | null = null;
let isInitialized = false;

if (env.NEXT_PUBLIC_FEATURE_GITHUB_API_ENABLED) {
	if (!env.GITHUB_ACCESS_TOKEN) {
		if (!isInitialized) {
			logger.error("GitHub API feature is enabled, but GITHUB_ACCESS_TOKEN is missing.");
			isInitialized = true;
		}
	} else {
		octokit = new Octokit({
			auth: env.GITHUB_ACCESS_TOKEN,
		});
		if (!isInitialized) {
			isInitialized = true;
		}
	}
} else {
	// logger.debug("GitHub API feature is disabled.");
}

// Export the potentially null octokit instance
export { octokit };

// --- Helper Function to check if service is enabled ---
const isGitHubServiceEnabled = (): boolean => {
	if (!octokit) {
		if (env.NEXT_PUBLIC_FEATURE_GITHUB_API_ENABLED) {
			// Log error only if the feature was supposed to be enabled but failed init
			logger.error(
				"GitHub Service was enabled but failed to initialize (likely missing token). Returning disabled state."
			);
		}
		return false;
	}
	return true;
};
// ----------------------------------------------------

interface GitHubAccessParams {
	githubUsername: string;
}

// Cache for 5 minutes
export const getRepo = cache(async (owner?: string, repo?: string) => {
	if (!isGitHubServiceEnabled()) {
		logger.debug("GitHub Service disabled, skipping getRepo.");
		return null;
	}
	try {
		// Use provided values or fall back to siteConfig defaults
		const repoOwner = owner || siteConfig.repo.owner;
		const repoName = repo || siteConfig.repo.name;

		const response = await octokit?.rest.repos.get({
			owner: repoOwner,
			repo: repoName,
		});

		if (!response?.data) {
			logger.error("No response data from GitHub API");
			return null;
		}

		return response.data;
	} catch (error) {
		logger.error("Error fetching GitHub stars:", error);
		return null;
	}
});

/**
 * Grants access to the private repository for a GitHub user
 */
export async function grantGitHubAccess({ githubUsername }: GitHubAccessParams) {
	if (!isGitHubServiceEnabled()) {
		logger.warn("GitHub Service disabled, skipping grantGitHubAccess.");
		// Decide on return type: throw error or return specific status?
		// Returning false for now, indicating failure/disabled.
		return false;
	}

	logger.info("Starting GitHub access grant", {
		githubUsername,
	});

	// Token existence check is implicitly handled by isGitHubServiceEnabled()

	if (!githubUsername) {
		logger.error("GitHub username missing");
		throw new Error("GitHub username is required");
	}

	try {
		// Check if user already has access using admin token
		logger.info("Checking existing repository access", {
			githubUsername,
			repository: `${siteConfig.repo.owner}/${siteConfig.repo.name}`,
		});

		try {
			const response = await octokit?.rest.repos.getCollaboratorPermissionLevel({
				owner: siteConfig.repo.owner,
				repo: siteConfig.repo.name,
				username: githubUsername,
			});

			const collaborator = response?.data;

			logger.info("Retrieved collaborator permission level", {
				githubUsername,
				permission: collaborator?.permission,
			});

			if (
				collaborator?.permission === "admin" ||
				collaborator?.permission === "write" ||
				collaborator?.permission === "read"
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
		// const userScopes = await getTokenScopes(accessToken);
		// logger.info("Verifying user token", {
		// 	githubUsername,
		// 	scopes: userScopes,
		// 	hasRepoScope: userScopes.includes("repo"),
		// });

		// if (!userScopes.includes("repo")) {
		// 	throw new Error("User token missing 'repo' scope");
		// }

		// const userOctokit = new Octokit({
		// 	auth: accessToken,
		// });

		// const { data: user } = await userOctokit.rest.users.getAuthenticated();

		// logger.info("User token verified", {
		// 	providedUsername: githubUsername,
		// 	authenticatedUsername: user.login,
		// });

		const payload = {
			owner: siteConfig.repo.owner,
			repo: siteConfig.repo.name,
			username: githubUsername,
			permission: "read",
		};

		// Add user as collaborator with write access using admin token
		logger.info("Adding user as repository collaborator", payload);

		await octokit?.rest.repos.addCollaborator(payload);

		logger.info("Successfully added user as repository collaborator", payload);

		return true;
	} catch (error) {
		logger.error("Error granting GitHub access", {
			error,
			githubUsername,
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
	if (!isGitHubServiceEnabled()) {
		logger.warn("GitHub Service disabled, skipping revokeGitHubAccess.");
		return false; // Indicate failure/disabled
	}
	try {
		// Get user details including their GitHub token and username
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				id: true,
				githubUsername: true,
				email: true,
			},
		});

		if (!user?.githubUsername) {
			logger.warn("No GitHub username found for user - cannot revoke repo access", { userId });
			return false; // Indicate no action taken (username not found)
		}

		if (siteConfig.repo.owner === user.githubUsername) {
			// Update user record
			await db
				?.update(users)
				.set({
					githubUsername: null,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId));
			return true;
		}

		// Check if user has active deployments or critical operations
		const hasActiveDeployments = await checkActiveDeployments(user.githubUsername);
		if (hasActiveDeployments) {
			throw new Error("Cannot revoke access while user has active deployments");
		}

		logger.info("Removing user as collaborator", {
			owner: siteConfig.repo.owner,
			repo: siteConfig.repo.name,
			username: user.githubUsername,
		});

		try {
			// First, check for and cancel any pending invitations
			try {
				const invitationsResponse = await octokit?.rest.repos.listInvitations({
					owner: siteConfig.repo.owner,
					repo: siteConfig.repo.name,
				});

				const pendingInvitation = invitationsResponse?.data?.find(
					(inv) => inv.invitee?.login?.toLowerCase() === user.githubUsername?.toLowerCase()
				);

				if (pendingInvitation) {
					logger.info("Found pending invitation, canceling it", {
						invitationId: pendingInvitation.id,
						username: user.githubUsername,
					});

					await octokit?.rest.repos.deleteInvitation({
						owner: siteConfig.repo.owner,
						repo: siteConfig.repo.name,
						invitation_id: pendingInvitation.id,
					});

					logger.info("Successfully canceled pending invitation", {
						invitationId: pendingInvitation.id,
						username: user.githubUsername,
					});
				}
			} catch (invError) {
				logger.warn("Error checking/canceling invitations", {
					error: invError instanceof Error ? invError.message : "Unknown error",
					username: user.githubUsername,
				});
				// Continue with removing collaborator even if invitation check fails
			}

			// Remove user as collaborator using admin token (for users who accepted)
			const response = await octokit?.rest.repos.removeCollaborator({
				owner: siteConfig.repo.owner,
				repo: siteConfig.repo.name,
				username: user.githubUsername,
			});

			// 204 = success, 404 = user was not a collaborator (might have been just invited)
			if (response?.status !== 204 && response?.status !== 404) {
				throw new Error(`Failed to remove collaborator: ${response?.status}`);
			}

			logger.info("Successfully removed user as collaborator", {
				status: response?.status,
				username: user.githubUsername,
			});

			// Update user record
			await db
				?.update(users)
				.set({
					githubUsername: null,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId));

			logger.info("Successfully revoked GitHub access", {
				userId,
				githubUsername: user.githubUsername,
			});
		} catch (removeError) {
			logger.error("Failed to remove GitHub collaborator", {
				error: removeError instanceof Error ? removeError.message : "Unknown error",
				username: user.githubUsername,
			});
			throw removeError;
		}
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
async function checkActiveDeployments(githubUsername: string): Promise<boolean> {
	if (!isGitHubServiceEnabled()) {
		logger.debug("GitHub Service disabled, skipping checkActiveDeployments.");
		return true; // Assume no active deployments if service is off
	}

	if (!env?.GITHUB_ACCESS_TOKEN) {
		logger.warn("GITHUB_ACCESS_TOKEN is not set in the environment.");
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
			(deployment: any) => deployment.creator?.login === githubUsername
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
	if (!isGitHubServiceEnabled()) {
		logger.debug("GitHub Service disabled, skipping getTokenScopes.");
		return [];
	}
	try {
		// Temporarily create an octokit instance for this check if needed,
		// or rely on the main octokit instance if it's guaranteed to be valid here.
		const tempOctokit = new Octokit({ auth: token });
		const response = await tempOctokit.request("GET /");
		return response.headers["x-oauth-scopes"]?.split(", ") ?? [];
	} catch (error) {
		logger.error("Error getting token scopes", { error });
		return [];
	}
}

/**
 * Check if a GitHub username exists
 */
export async function checkGitHubUsername(username: string): Promise<boolean> {
	if (!isGitHubServiceEnabled()) {
		logger.debug("GitHub Service disabled, skipping checkGitHubUsername.");
		return true; // Or false? Depending on desired behavior when disabled.
	}
	logger.info("Checking if GitHub username exists", { username });

	try {
		await octokit?.rest.users.getByUsername({
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

// Cache the star count for 5 minutes to avoid hitting GitHub's rate limits
export const getRepoStars = cache(
	async ({
		owner = siteConfig.repo.owner,
		repo = siteConfig.repo.name,
	}: {
		owner?: string;
		repo?: string;
	} = {}) => {
		if (!isGitHubServiceEnabled()) {
			logger.debug("GitHub Service disabled, skipping getRepoStars.");
			return 0;
		}
		try {
			const response = await getRepo(owner, repo);
			return response?.stargazers_count ?? 0;
		} catch (error) {
			logger.warn("Error fetching GitHub stars:", error);
			return 0;
		}
	}
);

/**
 * Verify and store a GitHub username for a user
 * This is a simplified version that just verifies the username exists and stores it
 */
export async function verifyAndStoreGitHubUsername(
	userId: string,
	username: string
): Promise<boolean> {
	if (!isGitHubServiceEnabled()) {
		logger.warn("GitHub Service disabled, skipping verifyAndStoreGitHubUsername.");
		return false; // Cannot verify or store if service is disabled
	}
	logger.info("Verifying and storing GitHub username", { userId, username });

	try {
		// First verify the username exists on GitHub
		const exists = await checkGitHubUsername(username);
		if (!exists) {
			logger.error("GitHub username does not exist", { username });
			throw new Error("GitHub username does not exist");
		}

		await grantGitHubAccess({ githubUsername: username });

		// Update the user record with the GitHub username
		await db
			?.update(users)
			.set({
				githubUsername: username,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		logger.info("Successfully stored GitHub username", { userId, username });
		return true;
	} catch (error) {
		logger.error("Error verifying and storing GitHub username", {
			error,
			userId,
			username,
			errorMessage: error instanceof Error ? error.message : "Unknown error",
		});
		throw error;
	}
}

/**
 * Gets detailed information about repository collaborators
 */
export async function getCollaboratorDetails(username: string): Promise<GitHubProfile | null> {
	if (!isGitHubServiceEnabled()) {
		logger.debug("GitHub Service disabled, skipping getCollaboratorDetails.");
		return null;
	}
	if (!username) {
		logger.warn("getCollaboratorDetails called with empty username");
		return null;
	}

	try {
		// Get collaborator permission level
		const collaboratorResponse = await octokit?.rest.repos.getCollaboratorPermissionLevel({
			owner: siteConfig.repo.owner,
			repo: siteConfig.repo.name,
			username,
		});
		const collaborator = collaboratorResponse?.data;

		// Get user profile information
		const profileResponse = await octokit?.rest.users.getByUsername({
			username,
		});
		const profile = profileResponse?.data;

		if (!profile || !collaborator?.permission) {
			return null;
		}

		return {
			login: profile.login,
			avatar_url: profile.avatar_url,
			html_url: profile.html_url,
			name: profile.name || profile.login,
			bio: profile.bio || "",
			company: profile.company,
			blog: profile.blog || "",
			location: profile.location,
			email: profile.email,
			public_repos: profile.public_repos,
			followers: profile.followers,
			following: profile.following,
			permission: collaborator.permission,
		};
	} catch (error) {
		logger.error("Error fetching collaborator details:", error);
		return null;
	}
}
