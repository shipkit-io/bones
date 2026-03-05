import { getSupabaseClient } from "./client";
import { createServerClient } from "./server";
import type { AuthResponse, AuthSession, AuthUser } from "./types";

/**
 * Supabase Authentication Helpers
 *
 * Provides utility functions for common authentication operations
 * with error handling and type safety.
 */

/**
 * Client-side authentication helpers (for use in components)
 */
export const supabaseAuth = {
	/**
	 * Sign in with email and password
	 */
	async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
		const supabase = getSupabaseClient();
		const result = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		return result as AuthResponse;
	},

	/**
	 * Sign up with email and password
	 */
	async signUp(
		email: string,
		password: string,
		options?: {
			data?: Record<string, any>;
			redirectTo?: string;
		}
	): Promise<AuthResponse> {
		const supabase = getSupabaseClient();
		const result = await supabase.auth.signUp({
			email,
			password,
			options,
		});

		return result as AuthResponse;
	},

	/**
	 * Sign in with OAuth provider
	 */
	async signInWithOAuth(
		provider: "github" | "google" | "discord",
		options?: {
			redirectTo?: string;
			scopes?: string;
		}
	) {
		const supabase = getSupabaseClient();
		return await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: options?.redirectTo,
				scopes: options?.scopes,
			},
		});
	},

	/**
	 * Sign out the current user
	 */
	async signOut() {
		const supabase = getSupabaseClient();
		return await supabase.auth.signOut();
	},

	/**
	 * Get the current session
	 */
	async getSession(): Promise<{ session: AuthSession | null; error: any }> {
		const supabase = getSupabaseClient();
		const result = await supabase.auth.getSession();
		return {
			session: result.data.session as AuthSession | null,
			error: result.error,
		};
	},

	/**
	 * Get the current user
	 */
	async getUser(): Promise<{ user: AuthUser | null; error: any }> {
		const supabase = getSupabaseClient();
		const result = await supabase.auth.getUser();
		return {
			user: result.data.user as AuthUser | null,
			error: result.error,
		};
	},

	/**
	 * Listen to auth state changes
	 */
	onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
		const supabase = getSupabaseClient();
		return supabase.auth.onAuthStateChange(callback);
	},

	/**
	 * Reset password
	 */
	async resetPassword(email: string, redirectTo?: string) {
		const supabase = getSupabaseClient();
		return await supabase.auth.resetPasswordForEmail(email, {
			redirectTo,
		});
	},

	/**
	 * Update password
	 */
	async updatePassword(password: string) {
		const supabase = getSupabaseClient();
		return await supabase.auth.updateUser({
			password,
		});
	},
};

/**
 * Server-side authentication helpers (for use in server components/API routes)
 */
export const supabaseServerAuth = {
	/**
	 * Get user from server context
	 * Note: This is a basic implementation. For full SSR support with cookies,
	 * you'll need to implement proper session management.
	 */
	async getUser(): Promise<{ user: AuthUser | null; error: any }> {
		const supabase = createServerClient();
		const result = await supabase.auth.getUser();
		return {
			user: result.data.user as AuthUser | null,
			error: result.error,
		};
	},

	/**
	 * Get session from server context
	 */
	async getSession(): Promise<{ session: AuthSession | null; error: any }> {
		const supabase = createServerClient();
		const result = await supabase.auth.getSession();
		return {
			session: result.data.session as AuthSession | null,
			error: result.error,
		};
	},
};

/**
 * Utility functions
 */
export const authUtils = {
	/**
	 * Check if a user is authenticated
	 */
	isAuthenticated: (user: AuthUser | null): user is AuthUser => {
		return user !== null && !!user.id;
	},

	/**
	 * Check if a session is valid and not expired
	 */
	isSessionValid: (session: AuthSession | null): session is AuthSession => {
		if (!session) return false;

		const now = Math.floor(Date.now() / 1000);
		const expiresAt = session.expires_at ?? session.expires_in + now;

		return expiresAt > now;
	},

	/**
	 * Get user role from metadata
	 */
	getUserRole: (user: AuthUser | null): string | null => {
		return user?.app_metadata?.role ?? user?.user_metadata?.role ?? null;
	},
};
