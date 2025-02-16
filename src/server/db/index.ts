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
