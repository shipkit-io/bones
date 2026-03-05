import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { safeDbExecute } from "@/server/db";
import {
	accounts,
	apiKeys,
	creditTransactions,
	deployments,
	payments,
	teamMembers,
	userCredits,
	users,
} from "@/server/db/schema";
import { isAdmin } from "@/server/services/admin-service";

/**
 * GET /api/admin/users/[userId]
 *
 * Get complete user data for admin dashboard.
 * Includes all related records: accounts, payments, deployments, API keys, credits, etc.
 */
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ userId: string }> },
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const adminStatus = await isAdmin({
			email: session.user.email,
			userId: session.user.id,
		});
		if (!adminStatus) {
			return NextResponse.json(
				{ error: "Admin access required" },
				{ status: 403 },
			);
		}

		const { userId } = await params;

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 },
			);
		}

		const emptyResult = {
			user: null,
			accounts: [],
			payments: [],
			deployments: [],
			apiKeys: [],
			credits: null,
			creditTransactions: [],
			teamMemberships: [],
		};

		const result = await safeDbExecute(async (db) => {
			const [
				user,
				userAccounts,
				userPayments,
				userDeployments,
				userApiKeys,
				userCreditsData,
				userCreditTransactions,
				userTeamMemberships,
			] = await Promise.all([
				db
					.select()
					.from(users)
					.where(eq(users.id, userId))
					.limit(1)
					.then((rows) => rows[0] ?? null),
				db.select().from(accounts).where(eq(accounts.userId, userId)),
				db.select().from(payments).where(eq(payments.userId, userId)),
				db.select().from(deployments).where(eq(deployments.userId, userId)),
				db.select().from(apiKeys).where(eq(apiKeys.userId, userId)),
				db
					.select()
					.from(userCredits)
					.where(eq(userCredits.userId, userId))
					.limit(1)
					.then((rows) => rows[0] ?? null),
				db
					.select()
					.from(creditTransactions)
					.where(eq(creditTransactions.userId, userId)),
				db.select().from(teamMembers).where(eq(teamMembers.userId, userId)),
			]);

			return {
				user,
				accounts: userAccounts,
				payments: userPayments,
				deployments: userDeployments,
				apiKeys: userApiKeys,
				credits: userCreditsData,
				creditTransactions: userCreditTransactions,
				teamMemberships: userTeamMemberships,
			};
		}, emptyResult);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Failed to fetch user data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user data" },
			{ status: 500 },
		);
	}
}
