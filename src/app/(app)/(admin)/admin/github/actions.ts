"use server";

import { revokeGitHubAccess } from "@/server/services/github/github-service";

export async function revokeGitHubAccessAction(userId: string) {
	try {
		await revokeGitHubAccess(userId);
		return { success: true };
	} catch (error) {
		console.error("Failed to revoke GitHub access:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
