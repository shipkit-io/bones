"use server";

import { logger } from "@/lib/logger";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
	notificationChannels,
	notificationHistory,
	notificationPreferences,
	notificationTemplates,
	type notificationChannelType,
	type notificationType,
} from "@/server/db/schema";
import { desc, eq, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schemas
const channelConfigSchema = z.object({
	email: z.boolean(),
	sms: z.boolean(),
	push: z.boolean(),
	slack: z.boolean(),
});

const notificationTypesSchema = z.object({
	security: z.boolean(),
	system: z.boolean(),
	marketing: z.boolean(),
	team: z.boolean(),
});

const scheduleSchema = z.object({
	timezone: z.string(),
	quietHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
	quietHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
	frequency: z.enum(["instant", "daily", "weekly"]),
});

/**
 * Update notification channel preferences
 */
export async function updateNotificationChannels(
	channels: Record<
		(typeof notificationChannelType.enumValues)[number],
		boolean
	>,
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return {
				success: false,
				error: "You must be logged in to update notification preferences",
			};
		}

		// Validate input
		const validatedChannels = channelConfigSchema.parse(channels);

		// Update or create channel preferences
		for (const [channel, enabled] of Object.entries(validatedChannels)) {
			await db
				.insert(notificationChannels)
				.values({
					userId: session.user.id,
					type: channel as (typeof notificationChannelType.enumValues)[number],
					enabled,
				})
				.onConflictDoUpdate({
					target: [notificationChannels.userId, notificationChannels.type],
					set: { enabled },
				});
		}

		revalidatePath("/settings/notifications");
		return { success: true, message: "Notification channels updated" };
	} catch (error) {
		logger.error("Failed to update notification channels:", error);
		return {
			success: false,
			error: "Failed to update notification channels",
		};
	}
}

/**
 * Update notification type preferences
 */
export async function updateNotificationTypes(
	types: Record<(typeof notificationType.enumValues)[number], boolean>,
) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return {
				success: false,
				error: "You must be logged in to update notification preferences",
			};
		}

		// Validate input
		const validatedTypes = notificationTypesSchema.parse(types);

		// Update preferences for each type
		for (const [type, enabled] of Object.entries(validatedTypes)) {
			const channels = enabled ? ["email"] : []; // Default to email if enabled
			await db
				.insert(notificationPreferences)
				.values({
					userId: session.user.id,
					type: type as (typeof notificationType.enumValues)[number],
					channels: JSON.stringify(channels),
				})
				.onConflictDoUpdate({
					target: [
						notificationPreferences.userId,
						notificationPreferences.type,
					],
					set: { channels: JSON.stringify(channels) },
				});
		}

		revalidatePath("/settings/notifications");
		return { success: true, message: "Notification types updated" };
	} catch (error) {
		logger.error("Failed to update notification types:", error);
		return {
			success: false,
			error: "Failed to update notification types",
		};
	}
}

/**
 * Update notification schedule preferences
 */
export async function updateNotificationSchedule(schedule: {
	timezone: string;
	quietHoursStart: string;
	quietHoursEnd: string;
	frequency: string;
}) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return {
				success: false,
				error: "You must be logged in to update notification preferences",
			};
		}

		// Validate input
		const validatedSchedule = scheduleSchema.parse(schedule);

		// Update all notification preferences with new schedule
		await db
			.update(notificationPreferences)
			.set({
				timezone: validatedSchedule.timezone,
				quietHoursStart: validatedSchedule.quietHoursStart,
				quietHoursEnd: validatedSchedule.quietHoursEnd,
				frequency: validatedSchedule.frequency,
				updatedAt: new Date(),
			})
			.where(eq(notificationPreferences.userId, session.user.id));

		revalidatePath("/settings/notifications");
		return { success: true, message: "Notification schedule updated" };
	} catch (error) {
		logger.error("Failed to update notification schedule:", error);
		return {
			success: false,
			error: "Failed to update notification schedule",
		};
	}
}

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences() {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return {
				success: false,
				error: "You must be logged in to view notification preferences",
			};
		}

		// Get channel preferences
		const channels = await db
			.select()
			.from(notificationChannels)
			.where(eq(notificationChannels.userId, session.user.id));

		// Get type preferences
		const types = await db
			.select()
			.from(notificationPreferences)
			.where(eq(notificationPreferences.userId, session.user.id));

		// Format preferences
		const preferences = {
			channels: Object.fromEntries(
				channels.map((c) => [c.type, c.enabled]),
			) as Record<(typeof notificationChannelType.enumValues)[number], boolean>,
			types: Object.fromEntries(
				types.map((t) => [
					t.type,
					(JSON.parse(t.channels || "[]") as string[]).length > 0,
				]),
			) as Record<(typeof notificationType.enumValues)[number], boolean>,
			schedule: types[0]
				? {
					timezone: types[0].timezone || "UTC",
					quietHoursStart: types[0].quietHoursStart || "22:00",
					quietHoursEnd: types[0].quietHoursEnd || "08:00",
					frequency: types[0].frequency || "instant",
				}
				: {
					timezone: "UTC",
					quietHoursStart: "22:00",
					quietHoursEnd: "08:00",
					frequency: "instant",
				},
		};

		return { success: true, data: preferences };
	} catch (error) {
		logger.error("Failed to get notification preferences:", error);
		return {
			success: false,
			error: "Failed to get notification preferences",
		};
	}
}

/**
 * Get user's notification history
 */
export async function getNotificationHistory(params?: {
	type?: (typeof notificationType.enumValues)[number];
	channel?: (typeof notificationChannelType.enumValues)[number];
	status?: "sent" | "delivered" | "failed";
	search?: string;
	limit?: number;
	offset?: number;
}) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return {
				success: false,
				error: "You must be logged in to view notification history",
			};
		}

		// Build query
		let query = db
			.select()
			.from(notificationHistory)
			.where(eq(notificationHistory.userId, session.user.id))
			.orderBy(desc(notificationHistory.sentAt));

		// Apply filters
		if (params?.type) {
			query = query.where(eq(notificationHistory.type, params.type));
		}
		if (params?.channel) {
			query = query.where(eq(notificationHistory.channel, params.channel));
		}
		if (params?.status) {
			query = query.where(eq(notificationHistory.status, params.status));
		}
		if (params?.search) {
			query = query.where(
				or(
					like(notificationHistory.title, `%${params.search}%`),
					like(notificationHistory.content, `%${params.search}%`),
				),
			);
		}

		// Apply pagination
		if (params?.limit) {
			query = query.limit(params.limit);
		}
		if (params?.offset) {
			query = query.offset(params.offset);
		}

		// Execute query
		const history = await query;

		return { success: true, data: history };
	} catch (error) {
		logger.error("Failed to get notification history:", error);
		return {
			success: false,
			error: "Failed to get notification history",
		};
	}
}

/**
 * Get notification templates
 */
export async function getNotificationTemplates(params?: {
	type?: (typeof notificationType.enumValues)[number];
	channel?: (typeof notificationChannelType.enumValues)[number];
	search?: string;
}) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return {
				success: false,
				error: "You must be logged in to view notification templates",
			};
		}

		// Build query
		let query = db
			.select()
			.from(notificationTemplates)
			.orderBy(desc(notificationTemplates.createdAt));

		// Apply filters
		if (params?.type) {
			query = query.where(eq(notificationTemplates.type, params.type));
		}
		if (params?.channel) {
			query = query.where(eq(notificationTemplates.channel, params.channel));
		}
		if (params?.search) {
			query = query.where(
				or(
					like(notificationTemplates.name, `%${params.search}%`),
					like(notificationTemplates.description, `%${params.search}%`),
				),
			);
		}

		// Execute query
		const templates = await query;

		return { success: true, data: templates };
	} catch (error) {
		logger.error("Failed to get notification templates:", error);
		return {
			success: false,
			error: "Failed to get notification templates",
		};
	}
}

/**
 * Create a notification template
 */
export async function createNotificationTemplate(data: {
	name: string;
	description?: string;
	type: (typeof notificationType.enumValues)[number];
	channel: (typeof notificationChannelType.enumValues)[number];
	subject?: string;
	content: string;
	variables: string[];
}) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return {
				success: false,
				error: "You must be logged in to create notification templates",
			};
		}

		// Validate required fields
		if (!data.name || !data.type || !data.channel || !data.content) {
			return {
				success: false,
				error: "Missing required fields",
			};
		}

		// Validate email subject
		if (data.channel === "email" && !data.subject) {
			return {
				success: false,
				error: "Email templates require a subject",
			};
		}

		// Create template
		const [template] = await db
			.insert(notificationTemplates)
			.values({
				...data,
				variables: JSON.stringify(data.variables),
				metadata: JSON.stringify({}),
			})
			.returning();

		return { success: true, data: template };
	} catch (error) {
		logger.error("Failed to create notification template:", error);
		return {
			success: false,
			error: "Failed to create notification template",
		};
	}
}

/**
 * Delete a notification template
 */
export async function deleteNotificationTemplate(templateId: string) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return {
				success: false,
				error: "You must be logged in to delete notification templates",
			};
		}

		// Delete template
		await db
			.delete(notificationTemplates)
			.where(eq(notificationTemplates.id, templateId));

		return { success: true };
	} catch (error) {
		logger.error("Failed to delete notification template:", error);
		return {
			success: false,
			error: "Failed to delete notification template",
		};
	}
}
