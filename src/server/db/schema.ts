import { env } from "@/env";
import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTableCreator,
	primaryKey,
	serial,
	text,
	timestamp,
	varchar
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
	orderId: varchar("orderId", { length: 255 }),
	amount: integer("amount"),
	status: varchar("status", { length: 255 }).notNull(),
	metadata: text("metadata").default("{}"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
		() => new Date(),
	),
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
