/**
 * API keys. Keys belong to a user and optionally to a project.
 */

import { relations } from "drizzle-orm";
import { text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { createTable } from "./core";
import { projects } from "./teams";

export const apiKeys = createTable("api_key", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: varchar("key", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 })
    // .notNull()
    .references(() => users.id),
  projectId: varchar("project_id", { length: 255 }).references(() => projects.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [apiKeys.projectId],
    references: [projects.id],
  }),
}));
