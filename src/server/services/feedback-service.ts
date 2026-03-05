import { sql } from "drizzle-orm";
import { resend } from "@/lib/resend";
import { db } from "@/server/db";
import { feedback } from "@/server/db/schema";
import { sendFeedbackEmail } from "@/server/services/resend-service";

export interface CreateFeedbackInput {
	content: string;
	source: "dialog" | "popover";
	metadata?: Record<string, unknown>;
}

export interface FeedbackResult {
	success: boolean;
	requiresEmailFallback?: boolean;
	data?: any;
	error?: string;
}

export const createFeedback = async (
	input: CreateFeedbackInput,
	options?: { skipEmail?: boolean }
): Promise<FeedbackResult> => {
	try {
		if (!input.content) {
			return { success: false, error: "Feedback content is required" };
		}

		if (input.content.length > 1000) {
			return { success: false, error: "Feedback content is too long" };
		}

		if (input.source !== "dialog" && input.source !== "popover") {
			return { success: false, error: "Invalid feedback source" };
		}

		if (input.metadata && typeof input.metadata !== "object") {
			return { success: false, error: "Invalid metadata" };
		}

		if (input.metadata && Object.keys(input.metadata).length > 10) {
			return { success: false, error: "Metadata cannot have more than 10 keys" };
		}

		// Try to save to database if available
		let dbResult = null;
		if (db) {
			try {
				const [result] = await db
					.insert(feedback)
					.values({
						content: input.content,
						source: input.source,
						metadata: JSON.stringify(input.metadata || {}),
					})
					.returning();
				dbResult = result;
			} catch (dbError) {
				console.warn("Database not available for feedback storage:", dbError);
			}
		}

		// Try to send email notification if not skipped
		if (!options?.skipEmail) {
			if (!resend) {
				// Resend not configured - require email fallback
				return {
					success: true,
					requiresEmailFallback: true,
					data: dbResult,
				};
			}

			try {
				await sendFeedbackEmail(input.content);
			} catch (emailError) {
				console.warn("Failed to send feedback email:", emailError);
				// Email failed but we saved to DB - suggest fallback
				return {
					success: true,
					requiresEmailFallback: true,
					data: dbResult,
				};
			}
		}

		return {
			success: true,
			requiresEmailFallback: false,
			data: dbResult,
		};
	} catch (error) {
		console.error("Error creating feedback:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to create feedback",
		};
	}
};

export const getFeedback = async () => {
	// Graceful fallback: if no database is available, return empty array
	if (!db) {
		console.warn("Database not available, returning empty feedback list");
		return [];
	}

	try {
		return await db.select().from(feedback).orderBy(feedback.createdAt);
	} catch (error) {
		console.error("Error getting feedback:", error);
		throw new Error("Failed to get feedback");
	}
};

export const updateFeedbackStatus = async (id: string, status: string) => {
	if (!["pending", "reviewed"].includes(status)) {
		throw new Error("Invalid feedback status");
	}

	// Graceful fallback: if no database is available, log and return mock result
	if (!db) {
		console.warn("Database not available, feedback status update will not be persisted");
		return {
			id,
			content: "",
			source: "dialog" as const,
			metadata: "{}",
			status: status as "pending" | "reviewed",
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}

	const [result] = await db
		.update(feedback)
		.set({ status, updatedAt: new Date() })
		.where(sql`${feedback.id} = ${id}`)
		.returning();

	return result;
};
