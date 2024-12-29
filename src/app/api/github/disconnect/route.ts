import { logger } from "@/lib/logger";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { accounts, users } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/github/disconnect
 * Revokes GitHub access and cleans up user data
 */
export async function POST(request: NextRequest) {
	const session = await auth();

	if (!session?.user?.id) {
		logger.warn("Unauthorized GitHub disconnect attempt");
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Update user record to remove GitHub data
		await db.transaction(async (tx) => {
			// Remove GitHub username
			await tx
				.update(users)
				.set({
					githubUsername: null,
				})
				.where(eq(users.id, session.user.id));

			// Delete only the GitHub provider account
			await tx
				.delete(accounts)
				.where(
					and(
						eq(accounts.userId, session.user.id),
						eq(accounts.provider, "github"),
					),
				);
		});

		logger.info("GitHub account disconnected", {
			userId: session.user.id,
		});

		// Return the updated user data for the session
		return NextResponse.json(
			{
				message: "GitHub account disconnected successfully",
				user: {
					githubUsername: null,
				},
			},
			{ status: 200 },
		);
	} catch (error) {
		logger.error("Error disconnecting GitHub account", {
			error,
			userId: session.user.id,
		});

		return NextResponse.json(
			{ error: "Failed to disconnect GitHub account" },
			{ status: 500 },
		);
	}
}
