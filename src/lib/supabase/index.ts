/**
 * Supabase Integration for Shipkit
 *
 * This module provides a complete Supabase integration that works alongside
 * the existing Auth.js implementation. It includes:
 *
 * - Client and server-side Supabase clients
 * - Authentication helpers for common operations
 * - Type definitions and utilities
 * - Graceful degradation when not configured
 *
 * @see https://supabase.com/docs/guides/auth/auth-helpers/nextjs
 */

// Auth helpers
export { authUtils, supabaseAuth, supabaseServerAuth } from "./auth-helpers";
// Client exports
export { createSupabaseClient, getSupabaseClient } from "./client";
// Server exports
export { createAnonServerClient, createServerClient } from "./server";

// Types and utilities
export type {
	AuthError,
	AuthResponse,
	AuthSession,
	AuthUser,
	Database,
	SupabaseClient,
} from "./types";

export { isSupabaseConfigured } from "./types";
