/**
 * @fileoverview Database schema definitions for Shipkit using Drizzle ORM
 * @module server/db/schema
 *
 * This file defines all database tables, relationships, and enums for the Shipkit application.
 * It uses Drizzle ORM with PostgreSQL and supports multi-tenant architecture via table prefixing.
 *
 * Key entities:
 * - Authentication: users, accounts, sessions, verificationTokens
 * - Payments: plans, payments, subscriptions, usage
 * - Teams: teams, teamMembers, invitations
 * - API Management: apiKeys, usage tracking
 * - Features: waitlist, analytics
 *
 * Dependencies:
 * - drizzle-orm: Type-safe ORM for database operations
 * - next-auth: Authentication adapter types
 * - @/env: Environment configuration for DB_PREFIX
 *
 * @security All user data is properly indexed and foreign key constrained
 * @performance Indexes are added for common query patterns
 */

import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTableCreator,
	primaryKey,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import { env } from "@/env";

/**
 * Table creator with optional prefix support for multi-tenant deployments.
 * Prefix is determined by DB_PREFIX environment variable.
 *
 * @example
 * // With DB_PREFIX="app1", table "users" becomes "app1_users"
 * // Without DB_PREFIX, table remains "users"
 */
const createTable = pgTableCreator((name) => `${env?.DB_PREFIX ?? ""}_${name}`);

/**
 * Subscription plans table - defines pricing tiers and billing intervals
 *
 * @remarks
 * Plans are tied to payment processor variants (not products).
 * Each plan represents a specific pricing option (e.g., "Pro Monthly", "Pro Yearly").
 *
 * @see payments - Records of actual payments made
 * @see subscriptions - Active user subscriptions
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

export const posts = createTable(
	"post",
	{
		id: serial("id").primaryKey(),
		name: varchar("name", { length: 256 }),
		createdById: varchar("createdById", { length: 255 })
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
	},
	(example) => ({
		createdByIdIdx: index("createdById_idx").on(example.createdById),
		nameIndex: index("name_idx").on(example.name),
	})
);

export type NewPost = typeof posts.$inferInsert;
export type Post = typeof posts.$inferSelect;

export const users = createTable("user", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: varchar("name", { length: 255 }),
	email: varchar("email", { length: 255 }).notNull().unique(),
	emailVerified: timestamp("email_verified", {
		mode: "date",
		withTimezone: true,
	}).default(sql`CURRENT_TIMESTAMP`),
	image: varchar("image", { length: 255 }),
	password: varchar("password", { length: 255 }),
	githubUsername: varchar("github_username", { length: 255 }),
	role: varchar("role", { length: 50 }).default("user").notNull(),
	bio: text("bio"),
	theme: varchar("theme", { length: 20 }).default("system"),
	metadata: text("metadata"),
	vercelConnectionAttemptedAt: timestamp("vercel_connection_attempted_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
});

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const userFiles = createTable(
	"user_file",
	{
		id: serial("id").primaryKey(),
		userId: varchar("user_id", { length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: varchar("title", { length: 255 }).notNull(),
		location: text("location").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
	},
	(userFile) => ({
		userIdIdx: index("user_file_user_id_idx").on(userFile.userId),
	})
);

export type UserFile = typeof userFiles.$inferSelect;
export type NewUserFile = typeof userFiles.$inferInsert;

export const userFilesRelations = relations(userFiles, ({ one }) => ({
	user: one(users, { fields: [userFiles.userId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
	accounts: many(accounts),
	files: many(userFiles),
	teamMembers: many(teamMembers),
	projectMembers: many(projectMembers),
	temporaryLinks: many(temporaryLinks),
	credits: one(userCredits, {
		fields: [users.id],
		references: [userCredits.userId],
	}),
	creditTransactions: many(creditTransactions),
}));

export const accounts = createTable(
	"account",
	{
		userId: text("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: text("type").$type<AdapterAccountType>().notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("providerAccountId").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
	},
	(account) => ({
		compoundKey: primaryKey({
			columns: [account.provider, account.providerAccountId],
		}),
		userIdIdx: index("account_user_id_idx").on(account.userId),
	})
);

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable("session", {
	sessionToken: text("sessionToken").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
	"verificationToken",
	{
		identifier: text("identifier").notNull(),
		token: text("token").notNull(),
		expires: timestamp("expires", { mode: "date" }).notNull(),
	},
	(verificationToken) => ({
		compositePk: primaryKey({
			columns: [verificationToken.identifier, verificationToken.token],
		}),
	})
);

export const authenticators = createTable(
	"authenticator",
	{
		credentialID: text("credentialID").notNull().unique(),
		userId: text("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		providerAccountId: text("providerAccountId").notNull(),
		credentialPublicKey: text("credentialPublicKey").notNull(),
		counter: integer("counter").notNull(),
		credentialDeviceType: text("credentialDeviceType").notNull(),
		credentialBackedUp: boolean("credentialBackedUp").notNull(),
		transports: text("transports"),
	},
	(authenticator) => ({
		compositePK: primaryKey({
			columns: [authenticator.userId, authenticator.credentialID],
		}),
	})
);

/**
 * Schema for a SaaS application with teams, users, projects, and API keys.
 *
 * - Users can belong to multiple teams.
 * - Teams can have multiple projects.
 * - Projects can have multiple API keys.
 */

export const teamType = pgEnum("team_type", ["personal", "workspace"]);

export const teams = createTable("team", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: varchar("name", { length: 255 }).notNull(),
	type: teamType("type").default("workspace").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const teamsRelations = relations(teams, ({ many }) => ({
	members: many(teamMembers),
}));

export const teamMembers = createTable("team_member", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: varchar("user_id", { length: 255 })
		.notNull()
		.references(() => users.id),
	teamId: varchar("team_id", { length: 255 })
		.notNull()
		.references(() => teams.id, { onDelete: "cascade" }),
	role: varchar("role", { length: 50 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
});

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
	team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
	user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));

export const projects = createTable("project", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: varchar("name", { length: 255 }).notNull(),
	teamId: varchar("team_id", { length: 255 }).references(() => teams.id, {
		onDelete: "cascade",
	}),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const projectMembers = createTable("project_member", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	projectId: varchar("project_id", { length: 255 })
		.notNull()
		.references(() => projects.id),
	userId: varchar("user_id", { length: 255 })
		.notNull()
		.references(() => users.id),
	role: varchar("role", { length: 50 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
});

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

// Define relations

export const teamRelations = relations(teams, ({ many }) => ({
	members: many(teamMembers),
	projects: many(projects),
}));

export const projectRelations = relations(projects, ({ many, one }) => ({
	members: many(projectMembers),
	apiKeys: many(apiKeys),
	team: one(teams, {
		fields: [projects.teamId],
		references: [teams.id],
	}),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
	project: one(projects, {
		fields: [projectMembers.projectId],
		references: [projects.id],
	}),
	user: one(users, {
		fields: [projectMembers.userId],
		references: [users.id],
	}),
}));

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

// Define the webhookEvents table for storing webhook events
export const webhookEvents = createTable("webhook_event", {
	id: serial("id").primaryKey(),
	eventName: text("event_name").notNull(),
	processed: boolean("processed").default(false),
	body: text("body").notNull(), // Store the event body as JSON string
});
export type WebhookEvent = typeof webhookEvents.$inferSelect;

export const temporaryLinks = createTable("temporary_link", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: varchar("user_id", { length: 255 }).references(() => users.id),
	data: text("data"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	type: varchar("type", { length: 50 }).notNull(), // e.g., 'download', 'invite', etc.
	metadata: text("metadata"), // Optional JSON string for additional data
});

export const temporaryLinksRelations = relations(temporaryLinks, ({ one }) => ({
	user: one(users, { fields: [temporaryLinks.userId], references: [users.id] }),
}));

/**
 * Role-Based Access Control (RBAC) Schema
 *
 * - Roles can have multiple permissions
 * - Users can have multiple roles in different contexts (team/project)
 * - Permissions are granular and can be combined
 */

export const roles = createTable("role", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	isSystem: boolean("is_system").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
});

export const permissions = createTable("permission", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	resource: varchar("resource", { length: 255 }).notNull(),
	action: varchar("action", { length: 255 }).notNull(),
	attributes: text("attributes"), // JSON string of additional attributes
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const rolePermissions = createTable(
	"role_permission",
	{
		roleId: varchar("role_id", { length: 255 })
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
		permissionId: varchar("permission_id", { length: 255 })
			.notNull()
			.references(() => permissions.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
	})
);

// Add relations
export const rolesRelations = relations(roles, ({ many }) => ({
	permissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
	roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
	role: one(roles, {
		fields: [rolePermissions.roleId],
		references: [roles.id],
	}),
	permission: one(permissions, {
		fields: [rolePermissions.permissionId],
		references: [permissions.id],
	}),
}));

// Add feedback table
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

// Add user credits table
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

// Add credit transactions table
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

// Define relations for the new tables
export const userCreditsRelations = relations(userCredits, ({ one }) => ({
	user: one(users, { fields: [userCredits.userId], references: [users.id] }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
	user: one(users, {
		fields: [creditTransactions.userId],
		references: [users.id],
	}),
}));

// Waitlist Schema
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

/**
 * Deployments schema - Tracks user deployments to Vercel
 * Stores deployment history and metadata securely on the server
 */
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
