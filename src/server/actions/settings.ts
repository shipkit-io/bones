"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { accounts, users } from "@/server/db/schema";

interface ProfileData {
	name: string;
	bio?: string;
	githubUsername?: string;
	metadata?: {
		location?: string;
		website?: string;
		company?: string;
		providers?: {
			github?: {
				id: string;
				email: string;
				avatar: string;
			};
		};
	};
}

interface SettingsData {
	theme: "light" | "dark" | "system";
}

export async function updateProfile(data: ProfileData) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		await db
			?.update(users)
			.set({
				name: data.name,
				bio: data.bio,
				githubUsername: data.githubUsername,
				metadata: data.metadata ? JSON.stringify(data.metadata) : null,
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		void revalidatePath(routes.settings.index);
		return { success: true, message: "Profile updated successfully" };
	} catch (error) {
		console.error("Failed to update profile:", error);
		return { success: false, error: "Failed to update profile" };
	}
}

export async function updateSettings(data: SettingsData) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		await db
			?.update(users)
			.set({
				theme: data.theme,
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		void revalidatePath(routes.settings.index);
		return { success: true, message: "Settings updated successfully" };
	} catch (error) {
		console.error("Failed to update settings:", error);
		return { success: false, error: "Failed to update settings" };
	}
}

export async function deleteAccount() {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		await db?.delete(users).where(eq(users.id, session.user.id));

		return { success: true, message: "Account deleted successfully" };
	} catch (error) {
		console.error("Failed to delete account:", error);
		return { success: false, error: "Failed to delete account" };
	}
}

export async function updateTheme(theme: "light" | "dark" | "system") {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		await db
			?.update(users)
			.set({
				theme,
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		void revalidatePath(routes.settings.index);
		return { success: true, message: "Theme updated successfully" };
	} catch (error) {
		console.error("Failed to update theme:", error);
		return { success: false, error: "Failed to update theme" };
	}
}

/**
 * Disconnects a provider from the user's account
 */
export async function disconnectAccount(
	provider: string
): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return { success: false, error: "You must be logged in to disconnect accounts" };
		}

		// Delete the account connection
		await db
			?.delete(accounts)
			.where(and(eq(accounts.userId, session.user.id), eq(accounts.provider, provider)));

		// Update the session directly
		const { update } = await import("@/server/auth");
		await update({
			user: {
				// Explicitly set accounts to simulate removal
				accounts: (session.user.accounts || []).filter((account) => account.provider !== provider),
			},
		});

		revalidatePath(routes.settings.index);
		return {
			success: true,
			message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account disconnected successfully`,
		};
	} catch (error) {
		console.error(`Failed to disconnect ${provider} account:`, error);
		return {
			success: false,
			error: `Failed to disconnect ${provider} account. Please try again.`,
		};
	}
}

/**
 * Records that a user attempted to connect their Vercel account
 * This allows the onboarding flow to continue even if the actual connection fails
 */
export async function markVercelConnectionAttempt() {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return {
				success: false,
				error: "You must be logged in to perform this action",
			};
		}

		// Update the database to record the connection attempt
		if (!db) {
			return {
				success: false,
				error: "Database not available",
			};
		}

		await db
			.update(users)
			.set({
				vercelConnectionAttemptedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		return {
			success: true,
			message: "Vercel connection attempt recorded",
		};
	} catch (error) {
		console.error("Error marking Vercel connection attempt:", error);
		return {
			success: false,
			error: "Failed to record connection attempt",
		};
	}
}
