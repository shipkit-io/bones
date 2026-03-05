import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Better Auth Database Schema
 *
 * This file defines the database schema for Better Auth.
 * These tables are separate from the existing Auth.js tables
 * to avoid conflicts and allow for coexistence.
 *
 * @see https://www.better-auth.com/docs/concepts/database
 */

// Better Auth User table
export const betterAuthUser = pgTable("better_auth_user", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	name: text("name").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),

	// Additional fields to match existing Payload user structure
	firstName: text("first_name"),
	lastName: text("last_name"),
	avatar: text("avatar"),
	role: text("role").default("user"),
});

// Better Auth Session table
export const betterAuthSession = pgTable("better_auth_session", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => betterAuthUser.id, { onDelete: "cascade" }),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Better Auth Account table (for OAuth connections)
export const betterAuthAccount = pgTable("better_auth_account", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => betterAuthUser.id, { onDelete: "cascade" }),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"), // For email/password auth
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Better Auth Verification table (for email verification, password reset)
export const betterAuthVerification = pgTable("better_auth_verification", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	identifier: text("identifier").notNull(), // email or phone
	value: text("value").notNull(), // verification token
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Better Auth Two-Factor Authentication table
export const betterAuthTwoFactor = pgTable("better_auth_two_factor", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => betterAuthUser.id, { onDelete: "cascade" }),
	secret: text("secret").notNull(),
	backupCodes: jsonb("backup_codes").$type<string[]>(),
	verified: boolean("verified").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Export all tables for use with Better Auth adapter
export const betterAuthSchema = {
	user: betterAuthUser,
	session: betterAuthSession,
	account: betterAuthAccount,
	verification: betterAuthVerification,
	twoFactor: betterAuthTwoFactor,
};

// Types for TypeScript
export type BetterAuthUser = typeof betterAuthUser.$inferSelect;
export type BetterAuthSession = typeof betterAuthSession.$inferSelect;
export type BetterAuthAccount = typeof betterAuthAccount.$inferSelect;
export type BetterAuthVerification = typeof betterAuthVerification.$inferSelect;
export type BetterAuthTwoFactor = typeof betterAuthTwoFactor.$inferSelect;

// Insert types
export type NewBetterAuthUser = typeof betterAuthUser.$inferInsert;
export type NewBetterAuthSession = typeof betterAuthSession.$inferInsert;
export type NewBetterAuthAccount = typeof betterAuthAccount.$inferInsert;
export type NewBetterAuthVerification = typeof betterAuthVerification.$inferInsert;
export type NewBetterAuthTwoFactor = typeof betterAuthTwoFactor.$inferInsert;
