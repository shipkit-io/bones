/**
 * Seeds GitHub and Vercel OAuth connections directly into the database.
 * Used by the full deploy flow E2E test to avoid automating third-party OAuth pages.
 */
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { pgTableCreator, text, varchar, integer, primaryKey } from "drizzle-orm/pg-core";
import postgres from "postgres";

// Re-declare minimal schema locally to avoid importing from the app (which pulls in @/env).
// DB_PREFIX must match what the running app uses (defaults to "db" like the app's env.ts).
const DB_PREFIX = process.env.DB_PREFIX ?? "db";
const createTable = pgTableCreator((name) => `${DB_PREFIX}_${name}`);

const users = createTable("user", {
	id: varchar("id", { length: 255 }).notNull().primaryKey(),
	name: varchar("name", { length: 255 }),
	email: varchar("email", { length: 255 }).notNull().unique(),
	githubUsername: varchar("github_username", { length: 255 }),
});

const accounts = createTable(
	"account",
	{
		userId: text("userId").notNull(),
		type: text("type").notNull(),
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
	}),
);

// Lazy singleton DB connection to avoid leaking connection pools
let _client: ReturnType<typeof postgres> | undefined;
let _db: ReturnType<typeof drizzle> | undefined;

function getDb() {
	if (_db) return _db;
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is required for seed-connections");
	_client = postgres(url, { max: 1 });
	_db = drizzle(_client, { schema: { users, accounts } });
	return _db;
}

export async function closeDb() {
	if (_client) {
		await _client.end();
		_client = undefined;
		_db = undefined;
	}
}

export async function getTestUserId(email: string): Promise<string> {
	const db = getDb();
	const rows = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
	if (!rows[0]) throw new Error(`Test user not found: ${email}`);
	return rows[0].id;
}

export async function seedGitHubConnection(userId: string, token: string, username: string) {
	const db = getDb();

	// Delete existing GitHub accounts for this user first (upsert via delete+insert)
	await db.delete(accounts).where(
		and(eq(accounts.userId, userId), eq(accounts.provider, "github")),
	);

	await db.insert(accounts).values({
		userId,
		type: "oauth",
		provider: "github",
		providerAccountId: username,
		access_token: token,
		token_type: "bearer",
		scope: "repo,workflow",
	});

	// Set githubUsername on the user record
	await db.update(users).set({ githubUsername: username }).where(eq(users.id, userId));
}

export async function seedVercelConnection(userId: string, token: string, vercelUserId: string) {
	const db = getDb();

	// Delete existing Vercel accounts for this user first
	await db.delete(accounts).where(
		and(eq(accounts.userId, userId), eq(accounts.provider, "vercel")),
	);

	// expires_at is seconds since epoch; set 30 days from now
	const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

	await db.insert(accounts).values({
		userId,
		type: "oauth",
		provider: "vercel",
		providerAccountId: vercelUserId,
		access_token: token,
		token_type: "bearer",
		expires_at: expiresAt,
	});
}

export async function cleanupConnections(userId: string) {
	const db = getDb();

	await db.delete(accounts).where(
		and(eq(accounts.userId, userId), eq(accounts.provider, "github")),
	);
	await db.delete(accounts).where(
		and(eq(accounts.userId, userId), eq(accounts.provider, "vercel")),
	);
	await db.update(users).set({ githubUsername: null }).where(eq(users.id, userId));
}
