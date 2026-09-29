/**
 * Authentication and user tables: users, accounts, sessions, verification tokens,
 * authenticators, user files and temporary links.
 *
 * Relations to other domains (teams, credits) are declared here because Drizzle
 * resolves relation callbacks lazily, so the circular imports are safe.
 */

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import { createTable } from "./core";
import { creditTransactions, userCredits } from "./credits";
import { projectMembers, teamMembers } from "./teams";

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
  // Better Auth models email verification as a boolean. Auth.js keeps the
  // timestamp above; both columns stay so either strategy can read its own.
  emailVerifiedFlag: boolean("email_verified_flag").default(false),
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
    // Better Auth columns. Nullable so existing Auth.js rows are untouched.
    // providerId/accountId/accessToken/refreshToken/idToken map onto the
    // Auth.js columns above; these are the ones Auth.js has no home for.
    id: varchar("id", { length: 255 }),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
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
  // Better Auth columns. Its `token` maps onto sessionToken and `expiresAt`
  // onto expires; the rest are nullable extras Auth.js never writes.
  id: varchar("id", { length: 255 }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
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
    // Better Auth columns. Its `value` maps onto token and `expiresAt` onto
    // expires; these are nullable extras Auth.js never writes.
    id: varchar("id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
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
