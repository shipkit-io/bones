"use server";

import { count, desc, eq } from "drizzle-orm";
import { safeDbExecute } from "@/server/db";
import { type NewWaitlistEntry, type WaitlistEntry, waitlistEntries } from "@/server/db/schema";

/**
 * Add a new entry to the waitlist
 */
export async function addWaitlistEntry(
	data: Omit<NewWaitlistEntry, "id" | "createdAt" | "updatedAt">
): Promise<WaitlistEntry | null> {
	return safeDbExecute(async (db) => {
		const [entry] = await db
			.insert(waitlistEntries)
			.values({
				...data,
				metadata: data.metadata || "{}",
			})
			.returning();

		if (!entry) {
			throw new Error("Failed to create waitlist entry");
		}

		return entry;
	}, null);
}

/**
 * Check if an email is already on the waitlist
 */
export async function isEmailOnWaitlist(email: string): Promise<boolean> {
	return safeDbExecute(async (db) => {
		const [entry] = await db
			.select({ id: waitlistEntries.id })
			.from(waitlistEntries)
			.where(eq(waitlistEntries.email, email))
			.limit(1);

		return !!entry;
	}, false);
}

/**
 * Get waitlist entry by email
 */
export async function getWaitlistEntryByEmail(email: string): Promise<WaitlistEntry | null> {
	return safeDbExecute(async (db) => {
		const [entry] = await db
			.select()
			.from(waitlistEntries)
			.where(eq(waitlistEntries.email, email))
			.limit(1);

		return entry || null;
	}, null);
}

/**
 * Get all waitlist entries with pagination
 */
export async function getWaitlistEntries(
	options: { limit?: number; offset?: number; orderBy?: "asc" | "desc" } = {}
): Promise<WaitlistEntry[]> {
	return safeDbExecute(async (db) => {
		const { limit = 50, offset = 0, orderBy = "desc" } = options;

		return await db
			.select()
			.from(waitlistEntries)
			.orderBy(orderBy === "desc" ? desc(waitlistEntries.createdAt) : waitlistEntries.createdAt)
			.limit(limit)
			.offset(offset);
	}, []);
}

/**
 * Get waitlist statistics
 */
export async function getWaitlistStats(): Promise<{
	total: number;
	notified: number;
	pending: number;
}> {
	return safeDbExecute(
		async (db) => {
			const [totalResult] = await db.select({ count: count() }).from(waitlistEntries);

			const [notifiedResult] = await db
				.select({ count: count() })
				.from(waitlistEntries)
				.where(eq(waitlistEntries.isNotified, true));

			const total = totalResult?.count || 0;
			const notified = notifiedResult?.count || 0;

			return {
				total,
				notified,
				pending: total - notified,
			};
		},
		{ total: 0, notified: 0, pending: 0 }
	);
}

/**
 * Mark an entry as notified
 */
export async function markWaitlistEntryAsNotified(email: string): Promise<void> {
	await safeDbExecute(async (db) => {
		await db
			.update(waitlistEntries)
			.set({
				isNotified: true,
				notifiedAt: new Date(),
			})
			.where(eq(waitlistEntries.email, email));
	}, undefined);
}

/**
 * Update entry metadata
 */
export async function updateWaitlistEntryMetadata(
	email: string,
	metadata: Record<string, any>
): Promise<void> {
	await safeDbExecute(async (db) => {
		await db
			.update(waitlistEntries)
			.set({
				metadata: JSON.stringify(metadata),
				updatedAt: new Date(),
			})
			.where(eq(waitlistEntries.email, email));
	}, undefined);
}
