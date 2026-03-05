import type { User } from "@clerk/nextjs/server";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Clerk Authentication Utilities
 *
 * This file provides utility functions for working with Clerk authentication.
 * Only used when Clerk is the active authentication strategy.
 */

/**
 * Get the current authenticated user from Clerk
 */
export async function getClerkUser(): Promise<User | null> {
	try {
		const user = await currentUser();
		return user;
	} catch (error) {
		console.error("Error getting Clerk user:", error);
		return null;
	}
}

/**
 * Get the current user's session information
 */
export async function getClerkSession() {
	try {
		const { userId, sessionId, orgId } = await auth();
		return {
			userId,
			sessionId,
			orgId,
			isAuthenticated: !!userId,
		};
	} catch (error) {
		console.error("Error getting Clerk session:", error);
		return {
			userId: null,
			sessionId: null,
			orgId: null,
			isAuthenticated: false,
		};
	}
}

/**
 * Check if user is authenticated
 */
export async function isClerkAuthenticated(): Promise<boolean> {
	const session = await getClerkSession();
	return session.isAuthenticated;
}

/**
 * Get user ID from Clerk session
 */
export async function getClerkUserId(): Promise<string | null> {
	const session = await getClerkSession();
	return session.userId;
}

/**
 * Convert Clerk user to Shipkit user format
 * This ensures compatibility with existing user interfaces
 */
export function formatClerkUser(clerkUser: User) {
	return {
		id: clerkUser.id,
		name: clerkUser.fullName ?? clerkUser.firstName ?? "Unknown",
		email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
		image: clerkUser.imageUrl ?? null,
		emailVerified:
			clerkUser.primaryEmailAddress?.verification?.status === "verified" ? new Date() : null,
		// Additional Clerk-specific fields that might be useful
		clerkId: clerkUser.id,
		firstName: clerkUser.firstName,
		lastName: clerkUser.lastName,
		username: clerkUser.username,
		phoneNumber: clerkUser.primaryPhoneNumber?.phoneNumber,
		createdAt: new Date(clerkUser.createdAt),
		updatedAt: new Date(clerkUser.updatedAt),
	};
}

/**
 * Get formatted user data for the current authenticated user
 */
export async function getCurrentFormattedUser() {
	const clerkUser = await getClerkUser();
	if (!clerkUser) return null;

	return formatClerkUser(clerkUser);
}

/**
 * Check if user has a specific role (for organization-based auth)
 */
export async function hasClerkRole(role: string): Promise<boolean> {
	try {
		const { orgRole } = await auth();
		return orgRole === role;
	} catch (error) {
		console.error("Error checking Clerk role:", error);
		return false;
	}
}

/**
 * Check if user is an admin (for organization-based auth)
 */
export async function isClerkAdmin(): Promise<boolean> {
	return hasClerkRole("admin");
}

/**
 * Get user's organization information
 */
export async function getClerkOrganization() {
	try {
		const { orgId, orgRole, orgSlug } = await auth();
		return {
			id: orgId,
			role: orgRole,
			slug: orgSlug,
			hasOrganization: !!orgId,
		};
	} catch (error) {
		console.error("Error getting Clerk organization:", error);
		return {
			id: null,
			role: null,
			slug: null,
			hasOrganization: false,
		};
	}
}

/**
 * Redirect URLs helper for Clerk
 */
export function getClerkRedirectUrls() {
	const baseUrl =
		process.env.NODE_ENV === "production"
			? process.env.VERCEL_URL
				? `https://${process.env.VERCEL_URL}`
				: "https://your-domain.com" // Replace with your production domain
			: "http://localhost:3000";

	return {
		signIn: `${baseUrl}/sign-in`,
		signUp: `${baseUrl}/sign-up`,
		afterSignIn: `${baseUrl}/dashboard`,
		afterSignUp: `${baseUrl}/dashboard`,
		userProfile: `${baseUrl}/settings/profile`,
	};
}
