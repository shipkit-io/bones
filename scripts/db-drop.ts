// import "../scripts/env-config.js";

import { sql } from "drizzle-orm";
import { db } from "@/server/db";

async function dropDatabase() {
	console.info("🗑️  Starting database cleanup...");

	try {
		// Drop all tables in the public schema
		await db?.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);

		// Recreate the public schema
		await db?.execute(sql`CREATE SCHEMA public`);

		// Drop Payload and Drizzle schemas
		console.info("📦 Dropping Payload and Drizzle schemas...");
		await db?.execute(sql`
			DROP SCHEMA IF EXISTS payload CASCADE;
		DROP SCHEMA IF EXISTS drizzle CASCADE;
		`);

		// Recreate the payload and drizzle schemas
		await db?.execute(sql`CREATE SCHEMA payload; CREATE SCHEMA drizzle;`);

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
