import { and, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";

/**
 * Check if a user has connected their Vercel account
 *
 * @param userId The ID of the user to check
 * @returns True if the user has connected their Vercel account, false otherwise
 */
export async function checkVercelConnection(userId: string): Promise<boolean> {
	logger.info("Checking Vercel connection", { userId });

	if (!userId) {
		logger.warn("No user ID provided for Vercel connection check");
		return false;
	}

	try {
		const vercelAccount = await db?.query.accounts.findFirst({
			where: and(eq(accounts.userId, userId), eq(accounts.provider, "vercel")),
		});

		const hasVercelConnection = !!vercelAccount;

		logger.info("Vercel connection status", {
			userId,
			hasVercelConnection,
		});

		return hasVercelConnection;
	} catch (error) {
		logger.error("Error checking Vercel connection", {
			userId,
			error: error instanceof Error ? error.message : "Unknown error",
		});
		return false;
	}
}

/**
 * Get the Vercel account for a user
 *
 * @param userId The ID of the user
 * @returns The Vercel account for the user, or null if not connected
 */
export async function getVercelAccount(userId: string) {
	logger.info("Getting Vercel account", { userId });

	if (!userId) {
		logger.warn("No user ID provided for Vercel account");
		return null;
	}

	try {
		const vercelAccount = await db?.query.accounts.findFirst({
			where: and(eq(accounts.userId, userId), eq(accounts.provider, "vercel")),
		});

		if (!vercelAccount) {
			logger.info("No Vercel account found for user", { userId });
			return null;
		}

		logger.info("Vercel account found for user", { userId });
		return vercelAccount;
	} catch (error) {
		logger.error("Error getting Vercel account", {
			userId,
			error: error instanceof Error ? error.message : "Unknown error",
		});
		return null;
	}
}

/**
 * Get the Vercel access token for a user
 *
 * @param userId The ID of the user
 * @returns The Vercel access token for the user, or null if not connected
 */
export async function getVercelAccessToken(userId: string): Promise<string | null> {
	logger.info("Getting Vercel access token", { userId });

	if (!userId) {
		logger.warn("No user ID provided for Vercel access token");
		return null;
	}

	try {
		const vercelAccount = await getVercelAccount(userId);

		if (!vercelAccount?.access_token) {
			logger.info("No Vercel access token found for user", { userId });
			return null;
		}

		// Check if token is expired
		if (vercelAccount.expires_at) {
			const now = Math.floor(Date.now() / 1000);
			if (vercelAccount.expires_at < now) {
				logger.warn("Vercel access token has expired", {
					userId,
					expiresAt: vercelAccount.expires_at,
					now,
				});
				return null;
			}
		}

		logger.info("Vercel access token retrieved for user", { userId });
		return vercelAccount.access_token;
	} catch (error) {
		logger.error("Error getting Vercel access token", {
			userId,
			error: error instanceof Error ? error.message : "Unknown error",
		});
		return null;
	}
}
