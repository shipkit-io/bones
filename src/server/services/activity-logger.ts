import { logger } from "@/lib/logger";
import {
	type ActivityLogOptions,
	ActivitySeverity,
} from "@/server/constants/activity-log";
import { db } from "@/server/db";
import { activityLogs } from "@/server/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import type { NextApiRequest } from "next";
import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

type RequestInfo = {
	userAgent?: string;
	ip?: string;
};

/**
 * Get request information from various sources
 * @param request - Optional Next.js API request object
 * @param headers - Optional Next.js headers object
 * @returns Request information including IP and user agent
 */
function getRequestInfo(
	request?: NextApiRequest,
	headers?: ReadonlyHeaders,
): RequestInfo {
	// If headers object is provided (App Router)
	if (headers) {
		return {
			userAgent: headers.get("user-agent") || undefined,
			ip:
				headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown",
		};
	}

	// If request object is provided (Pages Router)
	if (request) {
		return {
			userAgent: request.headers["user-agent"],
			ip:
				request.headers["x-forwarded-for"]?.toString() ||
				request.socket.remoteAddress ||
				"unknown",
		};
	}

	// Default values if no context is provided
	return {
		userAgent: undefined,
		ip: "unknown",
	};
}

/**
 * Log an activity with the given options
 * @param options - The activity log options
 * @param request - Optional Next.js API request object (for Pages Router)
 * @param headers - Optional Next.js headers object (for App Router)
 * @returns The created activity log entry or null if logging fails
 */
export async function logActivity(
	options: ActivityLogOptions,
	request?: NextApiRequest,
	headers?: ReadonlyHeaders,
) {
	try {
		const { userAgent, ip } = getRequestInfo(request, headers);

		// Validate required fields
		if (!options.action || !options.category) {
			throw new Error(
				"Missing required fields: action and category are required",
			);
		}

		// Create activity log entry
		const [activity] = await db
			.insert(activityLogs)
			.values({
				id: crypto.randomUUID(), // Ensure we generate a UUID
				teamId: options.teamId,
				userId: options.userId,
				action: options.action,
				category: options.category,
				severity: options.severity || ActivitySeverity.INFO,
				details: options.details,
				metadata: options.metadata ? JSON.stringify(options.metadata) : null,
				ipAddress: ip,
				userAgent,
				resourceId: options.resourceId,
				resourceType: options.resourceType,
				expiresAt: options.expiresAt,
				timestamp: new Date(), // Ensure we set the timestamp
			})
			.returning();

		logger.info("Activity logged", {
			id: activity?.id,
			action: options.action,
			category: options.category,
			severity: options.severity,
			userId: options.userId,
			teamId: options.teamId,
			resourceId: options.resourceId,
			resourceType: options.resourceType,
			details: options.details,
		});

		return activity;
	} catch (error) {
		logger.error("Failed to log activity", {
			error,
			...options,
		});
		// Don't throw the error - logging should not break the main flow
		return null;
	}
}

/**
 * Get activities for a team with filtering options
 * @param teamId - The ID of the team to get activities for
 * @param options - Filter options for activities
 * @returns Array of activity logs for the team
 */
export async function getTeamActivities(
	teamId: string,
	options: {
		limit?: number;
		category?: string;
		severity?: string;
		startDate?: Date;
		endDate?: Date;
		resourceType?: string;
	} = {},
) {
	try {
		const conditions = [eq(activityLogs.teamId, teamId)];

		if (options.category) {
			conditions.push(eq(activityLogs.category, options.category));
		}

		if (options.severity) {
			conditions.push(eq(activityLogs.severity, options.severity));
		}

		if (options.resourceType) {
			conditions.push(eq(activityLogs.resourceType, options.resourceType));
		}

		if (options.startDate) {
			conditions.push(sql`${activityLogs.timestamp} >= ${options.startDate}`);
		}

		if (options.endDate) {
			conditions.push(sql`${activityLogs.timestamp} <= ${options.endDate}`);
		}

		return await db
			.select()
			.from(activityLogs)
			.where(and(...conditions))
			.orderBy(desc(activityLogs.timestamp))
			.limit(options.limit || 50);
	} catch (error) {
		logger.error("Failed to get team activities", {
			error,
			teamId,
			options,
		});
		return [];
	}
}

/**
 * Get activities for a user with filtering options
 * @param userId - The ID of the user to get activities for
 * @param options - Filter options for activities
 * @returns Array of activity logs for the user
 */
export async function getUserActivities(
	userId: string,
	options: {
		limit?: number;
		category?: string;
		severity?: string;
		startDate?: Date;
		endDate?: Date;
		resourceType?: string;
	} = {},
) {
	try {
		const conditions = [eq(activityLogs.userId, userId)];

		if (options.category) {
			conditions.push(eq(activityLogs.category, options.category));
		}

		if (options.severity) {
			conditions.push(eq(activityLogs.severity, options.severity));
		}

		if (options.resourceType) {
			conditions.push(eq(activityLogs.resourceType, options.resourceType));
		}

		if (options.startDate) {
			conditions.push(sql`${activityLogs.timestamp} >= ${options.startDate}`);
		}

		if (options.endDate) {
			conditions.push(sql`${activityLogs.timestamp} <= ${options.endDate}`);
		}

		return await db
			.select()
			.from(activityLogs)
			.where(and(...conditions))
			.orderBy(desc(activityLogs.timestamp))
			.limit(options.limit || 50);
	} catch (error) {
		logger.error("Failed to get user activities", {
			error,
			userId,
			options,
		});
		return [];
	}
}

/**
 * Get system activities with filtering options
 * @param options - Filter options for activities
 * @returns Array of system activity logs
 */
export async function getSystemActivities(
	options: {
		limit?: number;
		severity?: string;
		startDate?: Date;
		endDate?: Date;
	} = {},
) {
	try {
		const conditions = [eq(activityLogs.category, "system")];

		if (options.severity) {
			conditions.push(eq(activityLogs.severity, options.severity));
		}

		if (options.startDate) {
			conditions.push(sql`${activityLogs.timestamp} >= ${options.startDate}`);
		}

		if (options.endDate) {
			conditions.push(sql`${activityLogs.timestamp} <= ${options.endDate}`);
		}

		return await db
			.select()
			.from(activityLogs)
			.where(and(...conditions))
			.orderBy(desc(activityLogs.timestamp))
			.limit(options.limit || 50);
	} catch (error) {
		logger.error("Failed to get system activities", {
			error,
			options,
		});
		return [];
	}
}
