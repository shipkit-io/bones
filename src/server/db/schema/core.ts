import { pgTableCreator } from "drizzle-orm/pg-core";
import { env } from "@/env";

/**
 * Table creator with optional prefix support for multi-tenant deployments.
 * Prefix is determined by DB_PREFIX environment variable.
 *
 * @example
 * // With DB_PREFIX="app1", table "users" becomes "app1_users"
 * // Without DB_PREFIX, table remains "users"
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${env?.DB_PREFIX ?? ""}_${name}`);
