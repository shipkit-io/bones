import { env } from "@/env";
import { auth } from "./config";

/**
 * Better Auth Service Layer
 *
 * This service provides utilities for managing Better Auth users,
 * sessions, and integrating with the existing Shipkit architecture.
 */

/**
 * Get the current session from the auth instance
 */
export async function getSession(request: Request) {
	try {
		return await auth.api.getSession({ headers: request.headers });
	} catch (error) {
		console.error("Better Auth: Failed to get session", error);
		return null;
	}
}

/**
 * Check if Better Auth is properly configured
 */
export function isConfigured() {
	return env.NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED;
}

/**
 * Get list of configured OAuth providers for Better Auth
 */
export function getConfiguredProviders(): string[] {
	const providers: string[] = [];

	if (env.NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED) providers.push("google");
	if (env.NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED) providers.push("github");
	if (env.NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED) providers.push("discord");

	return providers;
}

/**
 * Handle authentication request
 */
export async function handleAuthRequest(request: Request): Promise<Response> {
	try {
		return await auth.handler(request);
	} catch (error) {
		console.error("Better Auth: Failed to handle auth request", error);
		return new Response("Authentication error", { status: 500 });
	}
}

/**
 * Validate session token
 */
export function validateSession(sessionToken: string) {
	try {
		// TODO: Implement session validation based on Better Auth API
		return null;
	} catch (error) {
		console.error("Better Auth: Failed to validate session", error);
		return null;
	}
}
