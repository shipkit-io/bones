import type { Config } from "drizzle-kit";

import { env } from "@/env";

const prefix = env?.DB_PREFIX ?? "";
export default {
	schema: "./src/server/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: env?.DATABASE_URL ?? "",
	},
	tablesFilter: [`${prefix}_*`],
	out: "./src/migrations",
	verbose: true,
	strict: true,
} satisfies Config;
