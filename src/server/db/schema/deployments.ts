/**
 * Deployments schema - Tracks user deployments to Vercel
 * Stores deployment history and metadata securely on the server
 */

import { relations, sql } from "drizzle-orm";
import { index, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { createTable } from "./core";

export const deployments = createTable(
  "deployments",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectName: text("project_name").notNull(),
    description: text("description"),
    githubRepoUrl: text("github_repo_url"),
    githubRepoName: text("github_repo_name"),
    vercelProjectId: text("vercel_project_id"),
    vercelProjectUrl: text("vercel_project_url"),
    vercelDeploymentId: text("vercel_deployment_id"),
    vercelDeploymentUrl: text("vercel_deployment_url"),
    status: text("status", {
      enum: ["deploying", "completed", "failed", "timeout"],
    })
      .notNull()
      .default("deploying"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (deployment) => ({
    userIdIdx: index("deployment_user_id_idx").on(deployment.userId),
    statusIdx: index("deployment_status_idx").on(deployment.status),
    createdAtIdx: index("deployment_created_at_idx").on(deployment.createdAt),
  })
);

export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;

// Define relations for deployments
export const deploymentsRelations = relations(deployments, ({ one }) => ({
  user: one(users, { fields: [deployments.userId], references: [users.id] }),
}));
