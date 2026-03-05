import { exec, spawn } from "child_process";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { promisify } from "util";
// import "../scripts/env-config.js";
import { getPayloadClient } from "@/lib/payload/payload";
import { seed } from "@/lib/payload/seed";
import { db } from "@/server/db";

const execAsync = promisify(exec);

// Helper function to run a command with interactive stdin
function spawnInteractive(command: string, args: string[], input?: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const proc = spawn(command, args, {
			stdio: input ? ["pipe", "inherit", "inherit"] : "inherit", // Connect stdout/stderr, pipe stdin if input is provided
			shell: true,
			env: { ...process.env, PAYLOAD_CONFIG_PATH: "src/payload.config.ts" },
		});

		if (input && proc.stdin) {
			proc.stdin.write(input);
			proc.stdin.end();
		}

		proc.on("close", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Process exited with code ${code}`));
			}
		});

		proc.on("error", (err) => {
			reject(err);
		});
	});
}

async function generateMigrations() {
	console.log("📝 Generating migrations...");

	try {
		// Generate Drizzle migrations
		console.log("📦 Generating Drizzle migrations...");
		await execAsync("bun run db:generate");
		console.log("✅ Drizzle migrations generated");

		// Generate Payload migrations using CLI directly with interactive stdin
		console.log("📦 Generating Payload migrations...");
		console.log("ℹ️ If prompted, press Enter to continue");

		await spawnInteractive("payload", ["migrate:create"]);
		console.log("✅ Payload migrations generated");
	} catch (error) {
		console.error("❌ Error generating migrations:", error);
		throw error;
	}
}

async function runPayloadMigrations() {
	console.log("📦 Running Payload migrations...");
	try {
		// Use spawn for interactive process, automatically answer "y" to prompts
		await spawnInteractive("payload", ["migrate"], "y\n");
		console.log("✅ Payload migrations completed");
	} catch (error) {
		if (error instanceof Error && error.message.includes("already exists")) {
			console.warn("⚠️ Some Payload tables already exist, continuing...");
		} else {
			throw error;
		}
	}
}

async function syncDatabase() {
	console.log("🔄 Starting database synchronization...");

	try {
		if (!db) {
			console.error("❌ Database connection not found");
			process.exit(1);
		}

		// 1. Generate migrations if no SKIP_MIGRATIONS
		if (process.env.SKIP_MIGRATIONS !== "true") {
			await generateMigrations();
		}

		// 2. Run Drizzle migrations
		console.log("📦 Running Drizzle migrations...");
		try {
			await migrate(db, {
				migrationsFolder: path.join(process.cwd(), "src/migrations"),
			});
			console.log("✅ Drizzle migrations completed");
		} catch (error) {
			// Check if the error is about existing types or schemas
			if (
				error instanceof Error &&
				(error.message.includes("already exists") ||
					error.message.includes("schema") ||
					error.message.includes("type"))
			) {
				console.warn("⚠️ Some database objects already exist, continuing...");
			} else {
				throw error;
			}
		}

		// 3. Run Payload migrations using CLI
		await runPayloadMigrations();

		// 4. Initialize Payload
		console.log("🚀 Initializing Payload CMS...");
		const payload = await getPayloadClient();
		if (!payload) {
			console.warn("⚠️ Did not initialize Payload");
		} else if (process.env.SEED_DB === "true") {
			console.log("🌱 Running database seed...");
			await seed();
			console.log("✅ Database seeded");
		}

		console.log("✨ Database synchronization completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error synchronizing database:", error);
		process.exit(1);
	}
}

void syncDatabase();
