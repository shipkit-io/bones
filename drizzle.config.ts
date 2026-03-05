import type { Config } from "drizzle-kit";

const prefix = process.env.DB_PREFIX ?? "";
export default {
	schema: "./src/server/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env?.DATABASE_URL ?? "",
	},
	tablesFilter: [`${prefix}_*`],
	out: "./src/migrations",
	verbose: true,
	strict: true,
} satisfies Config;
