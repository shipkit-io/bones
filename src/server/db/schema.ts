import { env } from "@/env";
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
	time,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
const createTable = pgTableCreator((name) => `${env?.DB_PREFIX ?? ""}_${name}`);

/* src/db/schema.ts */
export const plans = createTable("plan", {
	id: serial("id").primaryKey(),
	productId: integer("productId").notNull(),
	productName: text("productName"),
	variantId: integer("variantId").notNull().unique(),
	name: text("name").notNull(),
	description: text("description"),
	price: text("price").notNull(),
	isUsageBased: boolean("isUsageBased").default(false),
	interval: text("interval"),
	intervalCount: integer("intervalCount"),
	trialInterval: text("trialInterval"),
	trialIntervalCount: integer("trialIntervalCount"),
	sort: integer("sort"),
});
export type NewPlan = typeof plans.$inferInsert;

export type Plan = typeof plans.$inferSelect;

export const payments = createTable("payment", {
	id: serial("id").primaryKey(),
	userId: varchar("userId", { length: 255 }).notNull(),
	status: varchar("status", { length: 255 }).notNull(),
});
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export const posts = createTable(
	"post",
	{
		id: serial("id").primaryKey(),
		name: varchar("name", { length: 256 }),
		createdById: varchar("created_by", { length: 255 })
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
			() => new Date(),
		),
	},
	(example) => ({
		createdByIdIdx: index("created_by_idx").on(example.createdById),
		nameIndex: index("name_idx").on(example.name),
	}),
);

export const users = createTable("user", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: varchar("name", { length: 255 }),
	email: varchar("email", { length: 255 }).notNull(),
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
	emailNotifications: boolean("email_notifications").default(true),
	metadata: text("metadata"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
});

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
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
	}),
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
	}),
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
	}),
);

/**
 * Schema for a SaaS application with teams, users, projects, and API keys.
 *
 * - Users can belong to multiple teams.
 * - Teams can have multiple projects.
 * - Projects can have multiple API keys.
 * - Logs are associated with API keys.
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
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
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
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
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
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
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
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
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
	projectId: varchar("project_id", { length: 255 }).references(
		() => projects.id,
	),
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

export const userRelations = relations(users, ({ many }) => ({
	teamMemberships: many(teamMembers),
	projectMemberships: many(projectMembers),
	temporaryLinks: many(temporaryLinks),
	notificationChannels: many(notificationChannels),
	notificationPreferences: many(notificationPreferences),
	notificationHistory: many(notificationHistory),
}));

export const logs = createTable("log", {
	id: serial("id").primaryKey(),
	timestamp: timestamp("timestamp", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	level: text("level").notNull(),
	message: text("message").notNull(),
	prefix: text("prefix"),
	emoji: text("emoji"),
	metadata: text("metadata"), // Store as JSON string
	apiKeyId: varchar("api_key_id", { length: 255 })
		.notNull()
		.references(() => apiKeys.id),
});

export const logRelations = relations(logs, ({ one }) => ({
	apiKey: one(apiKeys, { fields: [logs.apiKeyId], references: [apiKeys.id] }),
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

export const paymentsRelations = relations(payments, ({ one }) => ({
	user: one(users, { fields: [payments.userId], references: [users.id] }),
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

export const activityLogs = createTable(
	"activity_log",
	{
		id: varchar("id", { length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		teamId: varchar("team_id", { length: 255 }).references(() => teams.id),
		userId: varchar("user_id", { length: 255 }).references(() => users.id),
		action: varchar("action", { length: 255 }).notNull(),
		category: varchar("category", { length: 50 }).notNull(), // auth, team, resource, system
		severity: varchar("severity", { length: 20 }).notNull().default("info"), // info, warning, error, critical
		details: text("details"),
		metadata: text("metadata"),
		ipAddress: varchar("ip_address", { length: 255 }),
		userAgent: text("user_agent"),
		resourceId: varchar("resource_id", { length: 255 }), // ID of the affected resource (if applicable)
		resourceType: varchar("resource_type", { length: 50 }), // Type of resource (if applicable)
		timestamp: timestamp("timestamp", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }), // Optional expiration for log retention
	},
	(table) => {
		return {
			timestampIdx: index("activity_log_timestamp_idx").on(table.timestamp),
			categoryIdx: index("activity_log_category_idx").on(table.category),
			severityIdx: index("activity_log_severity_idx").on(table.severity),
			userIdIdx: index("activity_log_user_id_idx").on(table.userId),
			teamIdIdx: index("activity_log_team_id_idx").on(table.teamId),
		};
	},
);

// Add relations for activity logs
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
	team: one(teams, { fields: [activityLogs.teamId], references: [teams.id] }),
	user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
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
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
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
	}),
);

// Add relations
export const rolesRelations = relations(roles, ({ many }) => ({
	permissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
	roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(
	rolePermissions,
	({ one }) => ({
		role: one(roles, {
			fields: [rolePermissions.roleId],
			references: [roles.id],
		}),
		permission: one(permissions, {
			fields: [rolePermissions.permissionId],
			references: [permissions.id],
		}),
	}),
);

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
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
});

// Entry categories for better organization
export const guideCategories = createTable("guide_category", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description").notNull(),
	icon: varchar("icon", { length: 50 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cross-references between entries
export const guideCrossReferences = createTable("guide_cross_reference", {
	id: serial("id").primaryKey(),
	sourceEntryId: integer("source_entry_id")
		.references(() => guideEntries.id)
		.notNull(),
	targetEntryId: integer("target_entry_id")
		.references(() => guideEntries.id)
		.notNull(),
	context: text("context").notNull(), // Why these entries are related
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Entry revisions for tracking changes
export const guideEntryRevisions = createTable("guide_entry_revision", {
	id: serial("id").primaryKey(),
	entryId: integer("entry_id")
		.references(() => guideEntries.id, { onDelete: "cascade" })
		.notNull(),
	content: text("content").notNull(),
	reason: text("reason").notNull(),
	contributorId: varchar("contributor_id", { length: 255 }).references(
		() => users.id,
		{ onDelete: "set null" },
	),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enhance the main guide entries table
export const guideEntries = createTable(
	"guide_entry",
	{
		id: serial("id").primaryKey(),
		searchTerm: text("search_term").notNull(),
		content: text("content").notNull(),
		categoryId: integer("category_id").references(() => guideCategories.id),
		popularity: integer("popularity").default(0).notNull(),
		reliability: integer("reliability").default(42).notNull(),
		dangerLevel: integer("danger_level").default(0).notNull(),
		travelAdvice: text("travel_advice"),
		whereToFind: text("where_to_find"),
		whatToAvoid: text("what_to_avoid"),
		funFact: text("fun_fact"),
		advertisement: text("advertisement"),
		contributorId: varchar("contributor_id", { length: 255 }).references(
			() => users.id,
			{ onDelete: "set null" },
		),
		searchVector: text("search_vector").notNull().default(""),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => {
		return {
			searchTermIdx: index("guide_entries_search_term_idx").on(
				table.searchTerm,
			),
			searchVectorIdx: index("guide_entries_search_vector_idx").on(
				table.searchVector,
			),
			popularityIdx: index("guide_entries_popularity_idx").on(table.popularity),
			categoryIdx: index("guide_entries_category_idx").on(table.categoryId),
		};
	},
);

// Then define relations
export const entriesRelations = relations(guideEntries, ({ one, many }) => ({
	category: one(guideCategories, {
		fields: [guideEntries.categoryId],
		references: [guideCategories.id],
	}),
	contributor: one(users, {
		fields: [guideEntries.contributorId],
		references: [users.id],
	}),
	revisions: many(guideEntryRevisions),
	sourceCrossReferences: many(guideCrossReferences, {
		relationName: "sourceCrossReferences",
		fields: [guideEntries.id],
		references: [guideCrossReferences.sourceEntryId],
	}),
	targetCrossReferences: many(guideCrossReferences, {
		relationName: "targetCrossReferences",
		fields: [guideEntries.id],
		references: [guideCrossReferences.targetEntryId],
	}),
}));

// Export types
export type GuideEntry = typeof guideEntries.$inferSelect;
export type NewGuideEntry = typeof guideEntries.$inferInsert;
export type GuideCategory = typeof guideCategories.$inferSelect;
export type GuideCrossReference = typeof guideCrossReferences.$inferSelect;
export type GuideEntryRevision = typeof guideEntryRevisions.$inferSelect;

// Notification channel types
export const notificationChannelType = pgEnum("notification_channel_type", [
	"email",
	"sms",
	"push",
	"slack",
]);

// Notification types
export const notificationType = pgEnum("notification_type", [
	"security",
	"system",
	"marketing",
	"team",
]);

// Notification channels table
export const notificationChannels = createTable("notification_channel", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: varchar("user_id", { length: 255 })
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	type: notificationChannelType("type").notNull(),
	enabled: boolean("enabled").default(true),
	configuration: text("configuration").default("{}"), // JSON string for channel-specific config
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
});

// Notification preferences table
export const notificationPreferences = createTable("notification_preference", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: varchar("user_id", { length: 255 })
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	type: notificationType("type").notNull(),
	channels: text("channels").default("[]"), // JSON array of enabled channel types
	quietHoursStart: time("quiet_hours_start", { withTimezone: true }),
	quietHoursEnd: time("quiet_hours_end", { withTimezone: true }),
	timezone: varchar("timezone", { length: 100 }).default("UTC"),
	frequency: varchar("frequency", { length: 50 }).default("instant"), // instant, daily, weekly
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
});

// Notification history table
export const notificationHistory = createTable("notification_history", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: varchar("user_id", { length: 255 })
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	type: notificationType("type").notNull(),
	channel: notificationChannelType("channel").notNull(),
	title: varchar("title", { length: 255 }).notNull(),
	content: text("content").notNull(),
	metadata: text("metadata").default("{}"), // JSON string for additional data
	status: varchar("status", { length: 50 }).notNull().default("sent"), // sent, delivered, failed
	sentAt: timestamp("sent_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	deliveredAt: timestamp("delivered_at", { withTimezone: true }),
	error: text("error"),
});

// Notification templates table
export const notificationTemplates = createTable("notification_template", {
	id: varchar("id", { length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	type: notificationType("type").notNull(),
	channel: notificationChannelType("channel").notNull(),
	subject: varchar("subject", { length: 255 }), // For email templates
	content: text("content").notNull(),
	variables: text("variables").default("[]"), // JSON array of variable names
	metadata: text("metadata").default("{}"), // JSON string for additional data
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
});

// Add relations
export const notificationChannelsRelations = relations(
	notificationChannels,
	({ one }) => ({
		user: one(users, {
			fields: [notificationChannels.userId],
			references: [users.id],
		}),
	}),
);

export const notificationPreferencesRelations = relations(
	notificationPreferences,
	({ one }) => ({
		user: one(users, {
			fields: [notificationPreferences.userId],
			references: [users.id],
		}),
	}),
);

export const notificationHistoryRelations = relations(
	notificationHistory,
	({ one }) => ({
		user: one(users, {
			fields: [notificationHistory.userId],
			references: [users.id],
		}),
	}),
);

// Add relations for revisions
export const guideEntryRevisionsRelations = relations(
	guideEntryRevisions,
	({ one }) => ({
		entry: one(guideEntries, {
			fields: [guideEntryRevisions.entryId],
			references: [guideEntries.id],
		}),
		contributor: one(users, {
			fields: [guideEntryRevisions.contributorId],
			references: [users.id],
		}),
	}),
);
