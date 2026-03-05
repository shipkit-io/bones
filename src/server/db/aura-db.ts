/**
 * Aura database connection — connects to the pipeline's PostgreSQL.
 * Uses AURA_DATABASE_URL (falls back to DATABASE_URL).
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as auraSchema from "./aura-schema";

const url = process.env.AURA_DATABASE_URL || process.env.DATABASE_URL;

const client = url
  ? postgres(url, {
      max: 3,
      connect_timeout: 10,
      idle_timeout: 30,
      transform: { undefined: null, ...({} as Record<string, never>) },
    })
  : undefined;

export const auraDb = client ? drizzle(client, { schema: auraSchema }) : undefined;

export { auraSchema };
