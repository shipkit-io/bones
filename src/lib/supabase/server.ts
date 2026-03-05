import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

/**
 * Creates a Supabase server client for use in Server Components and API routes
 *
 * This client uses the service role key for server-side operations when available,
 * or falls back to the anon key with proper session handling.
 *
 * @see https://supabase.com/docs/guides/auth/auth-helpers/nextjs
 */
export const createServerClient = () => {
	if (!env.NEXT_PUBLIC_SUPABASE_URL) {
		throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
	}

	// Use service role key for server operations if available
	const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!key) {
		throw new Error(
			"Missing Supabase keys. Please ensure either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is set."
		);
	}

	return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
		auth: {
			// Configure auth settings for server
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false,
		},
	});
};

/**
 * Creates a Supabase client with anon key for server-side session management
 * This is used when you need to respect RLS policies in server components
 */
export const createAnonServerClient = () => {
	if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
		throw new Error(
			"Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
		);
	}

	return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false,
		},
	});
};
