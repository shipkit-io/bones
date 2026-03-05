import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

/**
 * Supabase client for browser usage
 *
 * This client is configured for client-side operations and includes
 * automatic session management with browser localStorage.
 *
 * @see https://supabase.com/docs/guides/auth/auth-helpers/nextjs
 */
export const createSupabaseClient = () => {
	if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
		throw new Error(
			"Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
		);
	}

	return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
		auth: {
			// Configure auth settings for browser
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: true,
			flowType: "pkce", // Use PKCE flow for better security
		},
	});
};

// Create a singleton instance for use across the app
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Get or create the Supabase client instance
 * Uses singleton pattern to avoid creating multiple instances
 */
export const getSupabaseClient = () => {
	if (!supabaseClient) {
		supabaseClient = createSupabaseClient();
	}
	return supabaseClient;
};
