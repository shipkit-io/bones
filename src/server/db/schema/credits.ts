/**
 * User credits: one balance row per user plus a transaction ledger.
 */

import { relations, sql } from "drizzle-orm";
import { index, integer, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { createTable } from "./core";

export const userCredits = createTable(
  "user_credit",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .unique() // Each user has one credit balance record
      .references(() => users.id, { onDelete: "cascade" }),
    balance: integer("balance").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("user_credit_user_id_idx").on(table.userId),
  })
);

export type UserCredit = typeof userCredits.$inferSelect;
export type NewUserCredit = typeof userCredits.$inferInsert;

export const creditTransactions = createTable(
  "credit_transaction",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(), // Positive for earning, negative for spending
    type: varchar("type", { length: 50 }).notNull(), // e.g., 'purchase', 'usage', 'refund', 'bonus'
    description: text("description"),
    metadata: text("metadata"), // Optional JSON string for additional data
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("credit_transaction_user_id_idx").on(table.userId),
    typeIdx: index("credit_transaction_type_idx").on(table.type),
  })
);

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;

export const userCreditsRelations = relations(userCredits, ({ one }) => ({
  user: one(users, { fields: [userCredits.userId], references: [users.id] }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));
