"use server";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
	emailNotifications: boolean;
}

export async function updateProfile(data: ProfileData) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		await db
			.update(users)
			.set({
				name: data.name,
				bio: data.bio,
				githubUsername: data.githubUsername,
				metadata: data.metadata ? JSON.stringify(data.metadata) : null,
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		revalidatePath("/settings");
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

		console.log("Server action received data:", data);

		// Ensure boolean type
		const emailNotifications = Boolean(data.emailNotifications);
		console.log("Processed emailNotifications:", emailNotifications);

		await db
			.update(users)
			.set({
				theme: data.theme,
				emailNotifications,
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		revalidatePath("/settings");
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

		await db.delete(users).where(eq(users.id, session.user.id));
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
			.update(users)
			.set({
				theme,
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id));

		revalidatePath("/settings");
		return { success: true, message: "Theme updated successfully" };
	} catch (error) {
		console.error("Failed to update theme:", error);
		return { success: false, error: "Failed to update theme" };
	}
}
