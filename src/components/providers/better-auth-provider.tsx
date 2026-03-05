"use client";

import type { ReactNode } from "react";
import { env } from "@/env";

interface BetterAuthProviderProps {
	children: ReactNode;
}

/**
 * Better Auth Provider Component
 *
 * This component provides Better Auth context to the application
 * when Better Auth is enabled. It provides utilities and hooks
 * for Better Auth throughout the app.
 *
 * Only renders when Better Auth is enabled via environment variables.
 */
export function BetterAuthProvider({ children }: BetterAuthProviderProps) {
	// For now, just render children - Better Auth client is available globally
	return <>{children}</>;
}

/**
 * Hook to check if Better Auth is enabled and available
 */
export function useBetterAuthEnabled() {
	return env.NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED;
}

/**
 * Hook to get Better Auth providers that are enabled
 */
export function useBetterAuthProviders() {
	const isBetterAuthEnabled = useBetterAuthEnabled();

	if (!isBetterAuthEnabled) {
		return [];
	}

	const providers = [];

	if (env.NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED) {
		providers.push("google");
	}

	if (env.NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED) {
		providers.push("github");
	}

	if (env.NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED) {
		providers.push("discord");
	}

	return providers;
}
