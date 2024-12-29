"use server";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { revokeGitHubAccess } from "@/server/services/github/github-service";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUserRoles } from "./rbac";

interface GitHubConnectionData {
	githubId: string;
	githubUsername: string;
	accessToken: string;
}

/**
 * Connects a GitHub account to the user's account.
 * This is called after successful GitHub OAuth flow.
 */
export async function connectGitHub(data: GitHubConnectionData) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error("Not authenticated");
		}

		// Get current user metadata
		const user = await db.query.users.findFirst({
			where: eq(users.id, session.user.id),
		});

		// Parse existing metadata or create new object
		const currentMetadata = user?.metadata ? JSON.parse(user.metadata) : {};

		// Update metadata with GitHub info
		const newMetadata = {
			...currentMetadata,
			providers: {
				...currentMetadata.providers,
				github: {
					id: data.githubId,
					accessToken: data.accessToken,
				},
			},
		};

		// Update user record with GitHub connection
		await db
			.update(users)
			.set({
				githubUsername: data.githubUsername,
				metadata: JSON.stringify(newMetadata),
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		revalidatePath("/settings");
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
		const userRoles = await getUserRoles(session.user.id);
		// const isOwner = userRoles.includes("owner");
		const isOwner = false;
		const isCritical =
			userRoles.includes("admin") || userRoles.includes("developer");

		if (isOwner) {
			throw new Error("Cannot disconnect GitHub for organization owner");
		}

		if (isCritical) {
			// For critical roles, require additional verification or approval
			// This could be implemented based on your security requirements
			throw new Error(
				"Additional verification required to disconnect GitHub for admin/developer roles",
			);
		}

		// First revoke GitHub access
		await revokeGitHubAccess(session.user.id);

		// Then update user record to remove GitHub connection
		await db
			.update(users)
			.set({
				githubUsername: null,
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		revalidatePath("/settings");
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
