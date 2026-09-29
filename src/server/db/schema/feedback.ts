/**
 * User feedback captured from the in-app dialog and popover.
 */

import { sql } from "drizzle-orm";
import { text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createTable } from "./core";

export const feedback = createTable("feedback", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull(),
  source: varchar("source", { length: 50 }).notNull(), // 'dialog' or 'popover'
  metadata: text("metadata").default("{}"),
  status: varchar("status", { length: 20 }).notNull().default("new"), // 'new', 'reviewed', 'archived'
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
});
