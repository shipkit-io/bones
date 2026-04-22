import { env } from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = env.DATABASE_URL ? postgres(env.DATABASE_URL) : undefined;

export const db = client ? drizzle(client, { schema }) : undefined;

// Export a function to check if the database is initialized
export const isDatabaseInitialized = () => {
	return !!db;
};

/**
 * Safely execute a database operation with fallback when db is not initialized.
 * Returns defaultValue if DATABASE_URL is not set or the operation fails.
 */
export const safeDbExecute = async <T>(
	callback: (db: NonNullable<typeof import("./index").db>) => Promise<T>,
	defaultValue: T
): Promise<T> => {
	if (!db) {
		console.warn("Database not initialized, returning default value");
		return defaultValue;
	}

	try {
		return await callback(db);
	} catch (error) {
		console.error("Database operation failed:", error);
		return defaultValue;
	}
};
