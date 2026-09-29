/**
 * Waitlist sign-ups.
 */

import { sql } from "drizzle-orm";
import { boolean, index, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createTable } from "./core";

export const waitlistEntries = createTable(
  "waitlist_entry",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    company: varchar("company", { length: 255 }),
    role: varchar("role", { length: 100 }),
    projectType: varchar("project_type", { length: 100 }),
    timeline: varchar("timeline", { length: 100 }),
    interests: text("interests"),
    isNotified: boolean("is_notified").default(false),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    source: varchar("source", { length: 50 }).default("website"), // website, referral, etc.
    metadata: text("metadata").default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (waitlistEntry) => ({
    emailIdx: index("waitlist_email_idx").on(waitlistEntry.email),
    createdAtIdx: index("waitlist_created_at_idx").on(waitlistEntry.createdAt),
    isNotifiedIdx: index("waitlist_is_notified_idx").on(waitlistEntry.isNotified),
  })
);

export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type NewWaitlistEntry = typeof waitlistEntries.$inferInsert;
