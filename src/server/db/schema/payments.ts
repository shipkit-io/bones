/**
 * Payment tables: plans and payments.
 * Shared by every payment provider (Lemon Squeezy, Stripe, Polar).
 */

import { relations, sql } from "drizzle-orm";
import { boolean, integer, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { createTable } from "./core";

/**
 * Subscription plans table - defines pricing tiers and billing intervals
 *
 * @remarks
 * Plans are tied to payment processor variants (not products).
 * Each plan represents a specific pricing option (e.g., "Pro Monthly", "Pro Yearly").
 *
 * @see payments - Records of actual payments made
 */
export const plans = createTable("plan", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(), // Payment processor product ID
  productName: text("productName"), // Human-readable product name
  variantId: integer("variantId").notNull().unique(), // Payment processor variant ID (CRITICAL: use this for checkout)
  name: text("name").notNull(), // Plan display name
  description: text("description"), // Plan features/description
  price: text("price").notNull(), // Price in smallest currency unit (cents)
  isUsageBased: boolean("isUsageBased").default(false), // Whether plan has usage-based pricing
  interval: text("interval"), // Billing interval: 'month', 'year', etc.
  intervalCount: integer("intervalCount"), // Number of intervals (e.g., 1 month, 3 months)
  trialInterval: text("trialInterval"), // Trial period interval
  trialIntervalCount: integer("trialIntervalCount"), // Trial period length
  sort: integer("sort"), // Display order
});
export type NewPlan = typeof plans.$inferInsert;
export type Plan = typeof plans.$inferSelect;

/**
 * Payments table - records all payment transactions
 *
 * @remarks
 * Stores both one-time and subscription payments.
 * Links to multiple payment processors (Lemon Squeezy, Stripe, Polar).
 *
 * @security PII is minimized - only essential payment data stored
 */
export const payments = createTable("payment", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(), // User who made payment
  orderId: varchar("order_id", { length: 255 }), // Internal order ID
  processorOrderId: varchar("processor_order_id", { length: 255 }), // Payment processor's order ID
  amount: integer("amount"), // Amount in cents
  status: varchar("status", { length: 255 }).notNull(),
  processor: varchar("processor", { length: 50 }),
  productName: text("product_name"),
  isFreeProduct: boolean("is_free_product").default(false),
  metadata: text("metadata").default("{}"),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
});
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));
