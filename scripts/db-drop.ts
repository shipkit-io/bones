import { db } from "@/server/db";
import { sql } from "drizzle-orm";

async function dropDatabase() {
	console.info("🗑️  Starting database cleanup...");

	try {
		// Drop all tables in the public schema
		console.info("📦 Dropping all tables...");

		// Drop Payload tables
		await db?.execute(sql`
			DO $$ DECLARE
				r RECORD;
			BEGIN
				-- Drop tables in payload schema
				FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'payload') LOOP
					EXECUTE 'DROP TABLE IF EXISTS payload.' || quote_ident(r.tablename) || ' CASCADE';
				END LOOP;

				-- Drop tables in public schema
				FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
					EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
				END LOOP;

				-- Drop tables in drizzle schema
				FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'drizzle') LOOP
					EXECUTE 'DROP TABLE IF EXISTS drizzle.' || quote_ident(r.tablename) || ' CASCADE';
				END LOOP;
			END $$;
		`);

		// Drop schemas
		await db?.execute(sql`
			DROP SCHEMA IF EXISTS payload CASCADE;
			DROP SCHEMA IF EXISTS drizzle CASCADE;
		`);

		// Drop custom types
		await db?.execute(sql`
			DO $$ DECLARE
				r RECORD;
			BEGIN
				FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
					EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
				END LOOP;
			END $$;
		`);

		console.info("✅ Database cleanup completed");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error cleaning up database:", error);
		process.exit(1);
	}
}

void dropDatabase();
