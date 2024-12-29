"use server";

import { auth } from "@/server/auth";
import { type ActivityLogOptions } from "@/server/constants/activity-log";
import { db } from "@/server/db";
import { activityLogs } from "@/server/db/schema";
import { logActivity as logActivityService } from "@/server/services/activity-logger";
import { desc, eq, sql } from "drizzle-orm";

/**
 * Log an activity
 */
export async function logActivity(options: Omit<ActivityLogOptions, "userId">) {
	const session = await auth();
	const userId = session?.user?.id;

	return logActivityService({
		...options,
		userId,
	});
}

/**
 * Get paginated activity logs with filtering
 */
export async function getActivityLogs({
	page = 1,
	limit = 50,
	category,
	severity,
	startDate,
	endDate,
	teamId,
	userId,
	resourceType,
	search,
}: {
	page?: number;
	limit?: number;
	category?: string;
	severity?: string;
	startDate?: Date;
	endDate?: Date;
	teamId?: string;
	userId?: string;
	resourceType?: string;
	search?: {
		query?: string;
	};
} = {}) {
	try {
		const offset = (page - 1) * limit;

		let whereClause = sql`1 = 1`;

		if (category) {
			whereClause = sql`${whereClause} AND ${eq(activityLogs.category, category)}`;
		}

		if (severity) {
			whereClause = sql`${whereClause} AND ${eq(activityLogs.severity, severity)}`;
		}

		if (teamId) {
			whereClause = sql`${whereClause} AND ${eq(activityLogs.teamId, teamId)}`;
		}

		if (userId) {
			whereClause = sql`${whereClause} AND ${eq(activityLogs.userId, userId)}`;
		}

		if (resourceType) {
			whereClause = sql`${whereClause} AND ${eq(
				activityLogs.resourceType,
				resourceType
			)}`;
		}

		if (startDate) {
			whereClause = sql`${whereClause} AND ${activityLogs.timestamp} >= ${startDate}`;
		}

		if (endDate) {
			whereClause = sql`${whereClause} AND ${activityLogs.timestamp} <= ${endDate}`;
		}

		if (search?.query) {
			whereClause = sql`${whereClause} AND (
				${activityLogs.action} ILIKE ${`%${search.query}%`} OR
				${activityLogs.details} ILIKE ${`%${search.query}%`}
			)`;
		}

		const [items, totalCount] = await Promise.all([
			db
				.select()
				.from(activityLogs)
				.where(whereClause)
				.orderBy(desc(activityLogs.timestamp))
				.limit(limit)
				.offset(offset),
			db
				.select({ count: sql<number>`count(*)` })
				.from(activityLogs)
				.where(whereClause)
				.then((result) => Number(result[0]?.count ?? 0)),
		]);

		return {
			data: items,
			pagination: {
				total: totalCount,
				totalPages: Math.ceil(totalCount / limit),
				currentPage: page,
				perPage: limit,
			},
		};
	} catch (error) {
		console.error("Failed to get activity logs:", error);
		return {
			data: [],
			pagination: {
				total: 0,
				totalPages: 0,
				currentPage: page,
				perPage: limit,
			},
		};
	}
}

/**
 * Search activity logs
 */
export async function searchActivityLogs(query: string, page = 1) {
	return getActivityLogs({
		page,
		search: { query },
	});
}

/**
 * Delete old activity logs
 */
export async function cleanupActivityLogs() {
	try {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		await db
			.delete(activityLogs)
			.where(
				sql`${activityLogs.expiresAt} IS NOT NULL AND ${activityLogs.expiresAt} <= ${thirtyDaysAgo}`
			);

		return { success: true };
	} catch (error) {
		console.error("Failed to cleanup activity logs:", error);
		return { success: false, error };
	}
}
