"use client";

import { SignIn, SignOutButton, SignUp, UserButton } from "@clerk/nextjs";
import { getAuthStrategy } from "@/lib/auth/auth-strategy";
import { clerkConfig } from "@/lib/auth/clerk-config";

/**
 * Clerk Authentication Form Components
 *
 * These components provide Clerk-specific authentication UI that integrates
 * with Clerk's built-in components and Shipkit's design system.
 */

/**
 * Clerk Sign In Component
 */
export function ClerkSignInForm() {
	const authStrategy = getAuthStrategy();

	if (authStrategy !== "clerk") {
		return null;
	}

	return (
		<div className="flex items-center justify-center">
			<SignIn
				appearance={clerkConfig.appearance}
				afterSignInUrl={clerkConfig.afterSignInUrl}
				signUpUrl={clerkConfig.signUpUrl}
			/>
		</div>
	);
}

/**
 * Clerk Sign Up Component
 */
export function ClerkSignUpForm() {
	const authStrategy = getAuthStrategy();

	if (authStrategy !== "clerk") {
		return null;
	}

	return (
		<div className="flex items-center justify-center">
			<SignUp
				appearance={clerkConfig.appearance}
				afterSignUpUrl={clerkConfig.afterSignUpUrl}
				signInUrl={clerkConfig.signInUrl}
			/>
		</div>
	);
}

/**
 * Clerk User Button - Shows user profile menu when authenticated
 */
export function ClerkUserButton() {
	const authStrategy = getAuthStrategy();

	if (authStrategy !== "clerk") {
		return null;
	}

	return (
		<UserButton
			appearance={clerkConfig.appearance}
			userProfileUrl={clerkConfig.userProfileUrl}
			afterSignOutUrl="/"
		/>
	);
}

/**
 * Clerk Sign Out Button
 */
interface ClerkSignOutButtonProps {
	children?: React.ReactNode;
	className?: string;
}

export function ClerkSignOutButton({ children, className }: ClerkSignOutButtonProps) {
	const authStrategy = getAuthStrategy();

	if (authStrategy !== "clerk") {
		return null;
	}

	return (
		<SignOutButton redirectUrl="/">
			{children ?? <button className={className}>Sign Out</button>}
		</SignOutButton>
	);
}

/**
 * Wrapper component that conditionally renders Clerk forms based on auth strategy
 */
interface ConditionalClerkComponentProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function ConditionalClerkComponent({
	children,
	fallback = null,
}: ConditionalClerkComponentProps) {
	const authStrategy = getAuthStrategy();

	if (authStrategy === "clerk") {
		return <>{children}</>;
	}

	return <>{fallback}</>;
}
