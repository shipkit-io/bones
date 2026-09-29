/**
 * Webhook events received from payment processors and other integrations.
 */

import { boolean, serial, text } from "drizzle-orm/pg-core";
import { createTable } from "./core";

// Define the webhookEvents table for storing webhook events
export const webhookEvents = createTable("webhook_event", {
  id: serial("id").primaryKey(),
  eventName: text("event_name").notNull(),
  processed: boolean("processed").default(false),
  body: text("body").notNull(), // Store the event body as JSON string
});
export type WebhookEvent = typeof webhookEvents.$inferSelect;
