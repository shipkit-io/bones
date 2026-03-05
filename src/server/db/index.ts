// import "server-only";

import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

// Configure postgres with proper options for production workloads
const client = env.DATABASE_URL
	? postgres(env.DATABASE_URL, {
			max: 3, // Increase connection pool for concurrent operations
			connect_timeout: 30, // Longer timeout for heavy operations
			idle_timeout: 30, // Longer idle timeout
			max_lifetime: 60 * 30, // 30 minutes max lifetime
			...(process.env.NODE_ENV === "development"
				? {
						ssl: { rejectUnauthorized: false }, // Needed for some Neon connections
					}
				: {}),
			transform: {
				undefined: null, // Transform undefined values to null
				...({} as Record<string, never>), // Empty transform object
			},
		})
	: undefined;

export const db = client ? drizzle(client, { schema }) : undefined;

// Export a function to check if the database is initialized and connected - Prefer checking db instead
export const isDatabaseInitialized = async () => {
	if (!db) return false;
	try {
		await db.execute(sql`SELECT 1`);
		return true;
	} catch (error) {
		console.error("Database connection failed:", error);
		return false;
	}
};

/**
 * Safe database execution utility
 * Executes a database operation only if the database is initialized
 * Returns a default value if the database is not available
 *
 * @param callback - The database operation to execute
 * @param defaultValue - The value to return if database is not initialized
 * @returns Promise<T> - The result of the callback or the default value
 */
export const safeDbExecute = async <T>(
	callback: (db: PostgresJsDatabase<typeof schema>) => Promise<T>,
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

// Export schema for direct usage
export * from "./schema";

export { schema };
