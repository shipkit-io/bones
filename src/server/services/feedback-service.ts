import { db } from "@/server/db";
import { feedback } from "@/server/db/schema";
import { sendFeedbackEmail } from "@/server/services/resend-service";
import { sql } from "drizzle-orm";

export interface CreateFeedbackInput {
	content: string;
	source: "dialog" | "popover";
	metadata?: Record<string, unknown>;
}

export const createFeedback = async (
	input: CreateFeedbackInput,
	options?: { skipEmail?: boolean },
) => {
	if (!input.content) {
		throw new Error("Feedback content is required");
	}

	if (input.content.length > 1000) {
		throw new Error("Feedback content is too long");
	}

	if (input.source !== "dialog" && input.source !== "popover") {
		throw new Error("Invalid feedback source");
	}

	if (input.metadata && typeof input.metadata !== "object") {
		throw new Error("Invalid metadata");
	}

	if (input.metadata && Object.keys(input.metadata).length > 10) {
		throw new Error("Metadata cannot have more than 10 keys");
	}

	const [result] = await db
		.insert(feedback)
		.values({
			content: input.content,
			source: input.source,
			metadata: JSON.stringify(input.metadata || {}),
		})
		.returning();

	// Send email notification
	if (!options?.skipEmail) {
		await sendFeedbackEmail(input.content);
	}

	return result;
};

export const getFeedback = async () => {
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

	const [result] = await db
		.update(feedback)
		.set({ status, updatedAt: new Date() })
		.where(sql`${feedback.id} = ${id}`)
		.returning();

	return result;
};
