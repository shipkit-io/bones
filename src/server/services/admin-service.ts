import { eq } from "drizzle-orm";
import { adminConfig } from "@/config/admin-config";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { rbacService } from "@/server/services/rbac";

/**
 * Admin service for server-side admin checking
 * This service is the single source of truth for admin status
 */

/**
 * Check if a user is an admin based on:
 * 1. Email configuration (admin emails and domains), for a verified account
 * 2. Database role check
 * 3. RBAC permissions
 *
 * There used to be a fourth check: existence in Payload's `users` collection.
 * It is gone, and it must not come back in that shape. See the note at the
 * bottom of this function (LAC-5048).
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

  // Load the account first. The config check below used to run against the raw
  // email string alone, which meant anyone who could present a matching address
  // was an admin, whether or not they had ever proved they owned it.
  const user = await db?.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    columns: {
      role: true,
      id: true,
      emailVerified: true,
    },
  });

  // 1. Static configuration, but only for a real account with a verified email.
  if (adminConfig.isAdminByEmailConfig(email)) {
    if (user?.emailVerified) {
      return true;
    }
    logger.warn("Admin config matched an email with no verified account; refusing admin", {
      email,
    });
  }

  // 2. Explicit role on the account.
  if (user?.role === "admin") {
    return true;
  }

  // 3. Check RBAC permissions if userId is provided or we found it in the database
  const userIdToCheck = userId ?? user?.id;
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

  // Deliberately no Payload check (LAC-5048).
  //
  // This used to end with "the email exists in Payload's `users` collection,
  // therefore admin", on the theory that membership implied admin panel
  // access. It does not imply anything of the sort. `auth-service` writes an
  // ordinary account into that same collection on normal credentials
  // registration (`signUpWithCredentials`, `createUserViaCMS`,
  // `ensureUserSynchronized`), so on any deployment with Payload enabled
  // every registered user cleared this gate and reached the whole admin
  // surface, including the GitHub collaborator actions.
  //
  // Nothing on the Payload side can currently tell an admin from a signup:
  // `lib/payload/collections/Users.ts` carries no role field and no access
  // control, so every member of the collection has identical rights. Until
  // that collection grows a real admin signal, membership proves nothing and
  // there is nothing here to check. Checks 1-3 cover the real cases, and an
  // admin who exists only in Payload is better locked out of `(admin)` than
  // every user let in. Payload's own `/cms` panel is unaffected either way:
  // it authenticates against Payload, not against this function.
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
