"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { getAuthStrategy } from "@/lib/auth/auth-strategy";
import { clerkConfig, getClerkPublishableKey, isClerkConfigured } from "@/lib/auth/clerk-config";

/**
 * Clerk Provider Wrapper Component
 *
 * This component conditionally wraps children with ClerkProvider when Clerk is the active
 * authentication strategy. For other strategies, it renders children directly.
 */

interface ClerkProviderWrapperProps {
	children: ReactNode;
}

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
	// Check if Clerk is the active authentication strategy
	const authStrategy = getAuthStrategy();

	// Only wrap with ClerkProvider when Clerk is active and properly configured
	if (authStrategy === "clerk" && isClerkConfigured()) {
		return (
			<ClerkProvider
				publishableKey={getClerkPublishableKey()}
				appearance={clerkConfig.appearance}
				signInUrl={clerkConfig.signInUrl}
				signUpUrl={clerkConfig.signUpUrl}
				afterSignInUrl={clerkConfig.afterSignInUrl}
				afterSignUpUrl={clerkConfig.afterSignUpUrl}
			>
				{children}
			</ClerkProvider>
		);
	}

	// For Auth.js or guest mode, render children directly
	return <>{children}</>;
}
