import type { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

/**
 * Supabase client configuration types and utilities
 */

// Get the type of the Supabase client instance
export type SupabaseClient = ReturnType<typeof createClient>;

// User types for authentication
export interface AuthUser {
	id: string;
	email?: string;
	user_metadata?: Record<string, any>;
	app_metadata?: Record<string, any>;
	created_at?: string;
	updated_at?: string;
}

// Session types
export interface AuthSession {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	expires_at?: number;
	token_type: string;
	user: AuthUser;
}

// Auth error types
export interface AuthError {
	message: string;
	status?: number;
}

// Auth response types
export interface AuthResponse {
	data: {
		user: AuthUser | null;
		session: AuthSession | null;
	};
	error: AuthError | null;
}

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
	return !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

/**
 * Database table types (to be extended as needed)
 */
export interface Database {
	public: {
		Tables: Record<string, never>;
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
	};
}
