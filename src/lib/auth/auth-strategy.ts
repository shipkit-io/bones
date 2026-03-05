import { env } from "@/env";

/**
 * Authentication Strategy Types
 */
export type AuthStrategy = "clerk" | "stack" | "authjs" | "better-auth" | "guest";

/**
 * Determines which authentication strategy to use based on environment variables
 * Priority: Clerk > Stack Auth > Better Auth > Auth.js > Guest
 */
export function getAuthStrategy(): AuthStrategy {
	// // Check if Clerk is configured
	// if (env.NEXT_PUBLIC_FEATURE_AUTH_CLERK_ENABLED === true) {
	// 	return "clerk";
	// }

	// // Check if Stack Auth is configured
	// if (env.NEXT_PUBLIC_FEATURE_AUTH_STACK_ENABLED === true) {
	// 	return "stack";
	// }

	// // Check if Better Auth is configured
	// if (env.NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED === true) {
	// 	return "better-auth";
	// }

	// Check if any Auth.js providers are configured
	const hasAuthJS =
		env.NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED ||
		env.NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED ||
		env.NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED ||
		env.NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED ||
		env.NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED ||
		env.NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED ||
		env.NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED ||
		env.NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED;

	if (hasAuthJS) {
		return "authjs";
	}

	// Fall back to guest mode
	return "guest";
}

/**
 * Check if authentication is available
 */
export function isAuthenticationAvailable(): boolean {
	return getAuthStrategy() !== "guest";
}

/**
 * Check if Clerk is the active auth strategy
 */
export function isClerkActive(): boolean {
	return getAuthStrategy() === "clerk";
}

/**
 * Check if Auth.js is the active auth strategy
 */
export function isAuthJSActive(): boolean {
	return getAuthStrategy() === "authjs";
}

/**
 * Check if guest mode is active
 */
export function isGuestModeActive(): boolean {
	return getAuthStrategy() === "guest";
}
