import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { apiKeys, logs, projectMembers } from "@/server/db/schema";
import type { LogLevel } from "@/types/logger";
import { and, desc, eq, inArray } from "drizzle-orm";

/**
 * Retrieves logs for a user based on their project memberships.
 * @param userId - The ID of the user.
 * @param limit - The maximum number of logs to retrieve.
 * @returns A list of logs.
 */
export async function getUserLogs(userId: string, limit = 100) {
	logger.info(`Fetching logs for user: ${userId}`);

	const userProjectIds = await db
		.select({ projectId: projectMembers.projectId })
		.from(projectMembers)
		.where(eq(projectMembers.userId, userId))
		.execute();

	logger.info(`Found ${userProjectIds.length} projects for user`);
	const projectIds = userProjectIds.map((up) => up.projectId);

	if (projectIds.length === 0) {
		logger.warn("No projects found for user");
		return [];
	}

	const apiKeyIds = await db
		.select({ id: apiKeys.id })
		.from(apiKeys)
		.where(inArray(apiKeys.projectId, projectIds))
		.execute();

	logger.info(`Found ${apiKeyIds.length} API keys for user's projects`);
	const keyIds = apiKeyIds.map((ak) => ak.id);

	if (keyIds.length === 0) {
		logger.warn("No API keys found for user's projects");
		return [];
	}

	const userLogs = await db.query.logs.findMany({
		where: inArray(logs.apiKeyId, keyIds),
		orderBy: [desc(logs.timestamp)],
		limit: limit,
		with: {
			apiKey: {
				with: {
					project: true,
				},
			},
		},
	});

	logger.info(`Found ${userLogs.length} logs for user`);
	return userLogs;
}

/**
 * Retrieves logs for a specific API key.
 * @param apiKeyId - The ID of the API key.
 * @param limit - The maximum number of logs to retrieve.
 * @returns A list of logs.
 */
export async function getApiKeyLogs(apiKeyId: string, limit = 100) {
	return db.query.logs.findMany({
		where: eq(logs.apiKeyId, apiKeyId),
		orderBy: [desc(logs.timestamp)],
		limit: limit,
	});
}

/**
 * Creates a new log entry.
 * @param logData - The data for the log entry.
 * @returns The created log entry.
 */
export async function createLog(logData: {
	level: LogLevel;
	message: string;
	timestamp: Date | string;
	prefix?: string;
	emoji?: string;
	metadata?: Record<string, unknown>;
	apiKey: string;
}) {
	const apiKeyRecord = await db.query.apiKeys.findFirst({
		where: eq(apiKeys.key, logData.apiKey),
	});

	if (!apiKeyRecord) {
		throw new Error("Invalid API key");
	}

	const timestamp =
		typeof logData.timestamp === "string"
			? new Date(logData.timestamp)
			: logData.timestamp;

	const [createdLog] = await db
		.insert(logs)
		.values({
			timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
			level: logData.level,
			message: logData.message,
			prefix: logData.prefix,
			emoji: logData.emoji,
			metadata: logData.metadata ? JSON.stringify(logData.metadata) : null,
			apiKeyId: apiKeyRecord.id,
		})
		.returning();

	return createdLog;
}

/**
 * Checks if a user has access to a specific API key.
 * @param userId - The ID of the user.
 * @param apiKeyId - The ID of the API key.
 * @returns True if the user has access, otherwise false.
 */
export async function userHasAccessToApiKey(
	userId: string,
	apiKeyId: string,
): Promise<boolean> {
	const apiKeyRecord = await db.query.apiKeys.findFirst({
		where: eq(apiKeys.id, apiKeyId),
		with: {
			project: true,
		},
	});

	if (!apiKeyRecord?.project) {
		return false;
	}

	const userProjectMember = await db.query.projectMembers.findFirst({
		where: and(
			eq(projectMembers.projectId, apiKeyRecord.project.id),
			eq(projectMembers.userId, userId),
		),
	});

	return !!userProjectMember;
}

// New function to get user's projects
export async function getUserProjects(userId: string) {
	return db.query.projectMembers.findMany({
		where: eq(projectMembers.userId, userId),
		with: {
			project: true,
		},
	});
}

// New function to get project's API keys
export async function getProjectApiKeys(projectId: string) {
	return db.query.apiKeys.findMany({
		where: eq(apiKeys.projectId, projectId),
	});
}
