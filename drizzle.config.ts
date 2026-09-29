import type { Config } from "drizzle-kit";

import { env } from "@/env";

const prefix = env?.DB_PREFIX ?? "";
export default {
  schema: "./src/server/db/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env?.DATABASE_URL ?? "",
  },
  // Better Auth creates unprefixed better_auth_* tables, so include them alongside the prefix.
  tablesFilter: [`${prefix}_*`, "better_auth_*"],
  out: "./src/migrations",
  verbose: true,
  strict: true,
} satisfies Config;
