/**
 * API-level cleanup for deployments created during E2E tests.
 * Runs in teardown even if tests fail — deletes GitHub repo, Vercel project, and DB records.
 */
import { eq, and, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { pgTableCreator, text } from "drizzle-orm/pg-core";
import postgres from "postgres";

const DB_PREFIX = process.env.DB_PREFIX ?? "db";
const createTable = pgTableCreator((name) => `${DB_PREFIX}_${name}`);

const deployments = createTable(
	"deployments",
	{
		id: text("id").notNull().primaryKey(),
		userId: text("user_id").notNull(),
		projectName: text("project_name").notNull(),
		vercelProjectId: text("vercel_project_id"),
		status: text("status").notNull(),
	},
);

// Lazy singleton DB connection
let _client: ReturnType<typeof postgres> | undefined;
let _db: ReturnType<typeof drizzle> | undefined;

function getDb() {
	if (_db) return _db;
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is required for cleanup");
	_client = postgres(url, { max: 1 });
	_db = drizzle(_client, { schema: { deployments } });
	return _db;
}

export async function closeDb() {
	if (_client) {
		await _client.end();
		_client = undefined;
		_db = undefined;
	}
}

interface CleanupOptions {
	githubOwner: string;
	githubRepoName?: string;
	vercelProjectId?: string;
	userId?: string;
	projectNamePrefix?: string;
}

export async function cleanupDeployment(opts: CleanupOptions) {
	const githubToken = process.env.TEST_GITHUB_TOKEN;
	const vercelToken = process.env.TEST_VERCEL_TOKEN;

	// Delete GitHub repo
	if (githubToken && opts.githubRepoName) {
		try {
			const res = await fetch(
				`https://api.github.com/repos/${opts.githubOwner}/${opts.githubRepoName}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `token ${githubToken}`,
						Accept: "application/vnd.github.v3+json",
					},
				},
			);
			if (res.ok || res.status === 404) {
				console.log(`GitHub repo ${opts.githubOwner}/${opts.githubRepoName} deleted (or already gone)`);
			} else {
				console.warn(`Failed to delete GitHub repo: ${res.status} ${res.statusText}`);
			}
		} catch (err) {
			console.warn("GitHub repo cleanup error:", err);
		}
	}

	// Delete Vercel project
	if (vercelToken && opts.vercelProjectId) {
		try {
			const res = await fetch(
				`https://api.vercel.com/v9/projects/${opts.vercelProjectId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${vercelToken}`,
					},
				},
			);
			if (res.ok || res.status === 404) {
				console.log(`Vercel project ${opts.vercelProjectId} deleted (or already gone)`);
			} else {
				console.warn(`Failed to delete Vercel project: ${res.status} ${res.statusText}`);
			}
		} catch (err) {
			console.warn("Vercel project cleanup error:", err);
		}
	}

	// Delete DB deployment records
	if (opts.userId && opts.projectNamePrefix) {
		try {
			const db = getDb();
			await db.delete(deployments).where(
				and(
					eq(deployments.userId, opts.userId),
					like(deployments.projectName, `${opts.projectNamePrefix}%`),
				),
			);
			console.log(`DB deployment records cleaned up for prefix: ${opts.projectNamePrefix}`);
		} catch (err) {
			console.warn("DB deployment cleanup error:", err);
		}
	}
}

/**
 * Cleanup any stale e2e-test-* repos and projects left from previous failed runs.
 */
export async function cleanupStaleTestResources(githubOwner: string) {
	const githubToken = process.env.TEST_GITHUB_TOKEN;
	if (!githubToken) return;

	try {
		const res = await fetch(
			`https://api.github.com/user/repos?per_page=100&sort=created&direction=desc`,
			{
				headers: {
					Authorization: `token ${githubToken}`,
					Accept: "application/vnd.github.v3+json",
				},
			},
		);
		if (!res.ok) return;

		const repos = await res.json() as Array<{ name: string; owner: { login: string } }>;
		const staleRepos = repos.filter(
			(r) => r.name.startsWith("e2e-test-") && r.owner.login === githubOwner,
		);

		for (const repo of staleRepos) {
			await cleanupDeployment({
				githubOwner,
				githubRepoName: repo.name,
			});
		}
	} catch (err) {
		console.warn("Stale resource cleanup error:", err);
	}
}
