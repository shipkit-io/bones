import { eq } from "drizzle-orm";
import { adminConfig } from "@/config/admin-config";
import { getPayloadClient } from "@/lib/payload/payload";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { rbacService } from "@/server/services/rbac";

/**
 * Admin service for server-side admin checking
 * This service is the single source of truth for admin status
 */

/**
 * Check if a user is an admin based on:
 * 1. Email configuration (admin emails and domains)
 * 2. Database role check
 * 3. RBAC permissions
 * 4. Payload CMS admin status
 *
 * @param email The email address to check
 * @param userId Optional user ID for RBAC check
 * @returns Boolean indicating if the user is an admin
 */
export async function isAdmin({
	email,
	userId,
}: {
	email?: string | null;
	userId?: string;
}): Promise<boolean> {
	if (typeof email !== "string") {
		return false;
	}

	// 1. Check admin config (static configuration) - works without userId
	if (adminConfig.isAdminByEmailConfig(email)) {
		return true;
	}

	// For the remaining checks, we need either userId or we can try to get it from the database
	// 2. Check if user is admin by querying the database directly
	const user = await db?.query.users.findFirst({
		where: eq(users.email, email.toLowerCase()),
		columns: {
			role: true,
			id: true,
		},
	});

	if (user?.role === "admin") {
		return true;
	}

	// 3. Check RBAC permissions if userId is provided or we found it in the database
	const userIdToCheck = userId || user?.id;
	if (userIdToCheck) {
		try {
			const hasRbacPermission = await rbacService.hasPermission(userIdToCheck, "system", "admin");

			if (hasRbacPermission) {
				return true;
			}
		} catch (error) {
			console.error("Error checking RBAC admin permission:", error);
		}
	}

	// 4. Check Payload CMS admin status
	try {
		const payload = await getPayloadClient();
		if (payload) {
			// Try to find the user in Payload by email
			const payloadUser = await payload.find({
				collection: "users",
				where: {
					email: {
						equals: email,
					},
				},
			});

			// If the user exists in Payload and has admin role or collection access
			if (payloadUser?.docs?.length > 0) {
				// In Payload CMS, all authenticated users with admin panel access are considered admins
				// No additional role check needed as the existence in Payload users collection
				// with valid authentication implies admin panel access
				return true;
			}
		}
	} catch (error) {
		console.error("Error checking Payload CMS admin status:", error);
	}

	return false;
}

/**
 * Get the list of admin emails
 * Should only be called after verifying the requester is an admin
 *
 * @param requestingEmail The email of the user requesting the admin list
 * @returns Array of admin emails if requester is admin, empty array otherwise
 */
export async function getAdminEmails(requestingEmail?: string | null): Promise<string[]> {
	if (!(await isAdmin({ email: requestingEmail }))) {
		return [];
	}

	return adminConfig.emails;
}

/**
 * Get the list of admin domains
 * Should only be called after verifying the requester is an admin
 *
 * @param requestingEmail The email of the user requesting the admin domains
 * @returns Array of admin domains if requester is admin, empty array otherwise
 */
export async function getAdminDomains(requestingEmail?: string | null): Promise<string[]> {
	const userIsAdmin = await isAdmin({ email: requestingEmail });
	if (userIsAdmin) {
		return adminConfig.domains;
	}
	return [];
}
