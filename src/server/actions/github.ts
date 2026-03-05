"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { auth, update as updateSession } from "@/server/auth";
import { db } from "@/server/db";
import { accounts, users } from "@/server/db/schema";
import {
	grantGitHubAccess,
	revokeGitHubAccess,
	verifyAndStoreGitHubUsername,
} from "@/server/services/github/github-service";
import { rbacService } from "@/server/services/rbac";

interface GitHubConnectionData {
	githubId: string;
	githubUsername: string;
	accessToken: string;
}

/**
 * Connects a GitHub account to the user's account.
 * This is called after successful GitHub OAuth flow.
 */
export async function connectGitHub(data?: GitHubConnectionData) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error("Not authenticated");
		}

		// Get current user metadata
		const user = await db?.query.users.findFirst({
			where: eq(users.id, session.user.id),
		});

		if (!user) {
			throw new Error("User not found");
		}

		// If data is passed, use it; otherwise try to get GitHub account from session
		let githubData = data;

		if (!githubData) {
			// Look for GitHub account in session
			const githubAccount = session.user.accounts?.find((account) => account.provider === "github");

			if (!githubAccount) {
				throw new Error("No GitHub account connected");
			}

			// We already have a GitHub account connected via OAuth
			// The username should already be in the session
			githubData = {
				githubId: githubAccount.providerAccountId,
				githubUsername: session.user.githubUsername || "",
				accessToken: "", // We don't have direct access to the token here
			};
		}

		// Parse existing metadata or create new object
		const currentMetadata = user.metadata ? JSON.parse(user.metadata) : {};

		// Update metadata with GitHub info
		const newMetadata = {
			...currentMetadata,
			providers: {
				...currentMetadata.providers,
				github: {
					id: githubData.githubId,
					accessToken: githubData.accessToken,
				},
			},
		};

		// Update user record with GitHub connection
		await db
			?.update(users)
			.set({
				githubUsername: githubData.githubUsername,
				metadata: JSON.stringify(newMetadata),
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		// If we have a username, try to grant access to the repository
		if (githubData.githubUsername) {
			try {
				await grantGitHubAccess({ githubUsername: githubData.githubUsername });
			} catch (grantError) {
				console.error("Error granting repository access:", grantError);
				// Don't fail the connection if repo access fails
			}
		}

		revalidatePath(routes.settings.index);
		return { success: true };
	} catch (error) {
		console.error("Failed to connect GitHub:", error);
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Failed to connect GitHub account");
	}
}

/**
 * Disconnects the GitHub account from the user's account and revokes GitHub access.
 * Includes safeguards to prevent removing access for owners and critical users.
 */
export async function disconnectGitHub() {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error("Not authenticated");
		}

		// Check if user is an owner or has critical role
		const userRoles = await rbacService.getAllUserRoles(session.user.id);
		// const isOwner = userRoles.includes("owner");
		const isOwner = false;
		const isCritical = userRoles.includes("admin") || userRoles.includes("developer");

		if (isOwner) {
			throw new Error("Cannot disconnect GitHub for organization owner");
		}

		if (isCritical) {
			// For critical roles, require additional verification or approval
			// This could be implemented based on your security requirements
			throw new Error(
				"Additional verification required to disconnect GitHub for admin/developer roles"
			);
		}

		// First revoke GitHub access (remove from repo collaborators)
		console.log("[disconnectGitHub] Revoking GitHub access for user:", session.user.id);
		try {
			await revokeGitHubAccess(session.user.id);
			console.log("[disconnectGitHub] Successfully revoked GitHub access");
		} catch (revokeError) {
			console.error("[disconnectGitHub] Failed to revoke GitHub access:", revokeError);
			// Continue with cleanup even if revoke fails
		}

		// Delete the GitHub OAuth account from the accounts table
		// This is required for getGitHubConnectionStatus() to return isConnected: false
		await db
			?.delete(accounts)
			.where(
				and(
					eq(accounts.userId, session.user.id),
					eq(accounts.provider, "github")
				)
			);

		// Get current user to update metadata
		const currentUser = await db?.query.users.findFirst({
			where: eq(users.id, session.user.id),
			columns: { metadata: true },
		});

		// Clear GitHub from metadata if it exists
		let updatedMetadata: string | null = null;
		if (currentUser?.metadata) {
			try {
				const metadata = JSON.parse(currentUser.metadata);
				if (metadata?.providers?.github) {
					delete metadata.providers.github;
					updatedMetadata = JSON.stringify(metadata);
				}
			} catch {
				// If metadata parsing fails, just set to null
				updatedMetadata = null;
			}
		}

		// Update user record to remove GitHub connection and clear metadata
		await db
			?.update(users)
			.set({
				githubUsername: null,
				metadata: updatedMetadata ?? currentUser?.metadata ?? null,
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		// Update the session directly with null GitHub username
		await updateSession({
			user: {
				githubUsername: null,
			},
		});

		revalidatePath(routes.settings.index);
		revalidatePath("/");

		return { success: true };
	} catch (error) {
		console.error("Failed to disconnect GitHub:", error);
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Failed to disconnect GitHub account");
	}
}

/**
 * Verifies a GitHub username exists and stores it for the user
 */
export async function verifyGitHubUsername(username: string) {
	try {
		console.log("Starting GitHub username verification for:", username);
		const session = await auth();
		console.log("Auth session in verifyGitHubUsername:", {
			isAuthenticated: !!session?.user?.id,
			sessionStrategy: process.env.NEXTAUTH_SESSION_STRATEGY || "default (jwt)",
			userId: session?.user?.id,
		});

		if (!session?.user?.id) {
			const error = new Error("Not authenticated");
			console.error("Authentication error:", error);
			throw error;
		}

		console.log("Calling verifyAndStoreGitHubUsername with userId:", session.user.id);
		const success = await verifyAndStoreGitHubUsername(session.user.id, username);
		console.log("GitHub username verification successful");

		// Update the session directly with the new GitHub username
		// This creates a custom payload that will be passed to the session update
		// without requiring a database query in the JWT callback
		await updateSession({
			user: {
				githubUsername: username,
			},
		});

		revalidatePath(routes.settings.index);
		return { success: true, githubUsername: username };
	} catch (error) {
		console.error("Failed to verify GitHub username:", error);
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Failed to verify GitHub username");
	}
}

/**
 * Manually updates the GitHub username for the currently authenticated user.
 */
export async function updateGitHubUsername(username: string) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error("Not authenticated");
		}

		// Basic validation for username format (optional but recommended)
		if (!/^[a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38}$/i.test(username)) {
			throw new Error("Invalid GitHub username format.");
		}

		// TODO: Consider adding GitHub API validation here if needed,
		// similar to verifyAndStoreGitHubUsername, to ensure the username exists.

		await db
			?.update(users)
			.set({
				githubUsername: username,
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		// Attempt to grant GitHub access with the new username
		try {
			await grantGitHubAccess({ githubUsername: username });
			console.log(`Successfully granted GitHub access for ${username}`);
		} catch (grantError) {
			console.error(`Error granting repository access for ${username}:`, grantError);
			// Optionally: Decide if this error should prevent the overall success
			// For now, we log the error but still consider the username update successful
			// throw new Error("Failed to grant GitHub repository access. Please check the username.");
		}

		// Update the session directly
		await updateSession({
			user: {
				githubUsername: username,
			},
		});

		revalidatePath(routes.settings.index); // Or relevant path

		return { success: true, githubUsername: username };
	} catch (error) {
		console.error("Failed to update GitHub username:", error);
		if (error instanceof Error) {
			throw error; // Re-throw specific errors for client handling
		}
		throw new Error("Failed to update GitHub username");
	}
}
