import type { Session } from "next-auth";
import { type User, UserRole } from "@/types/user";

/**
 * Better Auth session -> Auth.js `Session`, and Clerk user -> Auth.js `Session`.
 *
 * Pure and dependency-free so the server facades (`@/server/better-auth/facade`,
 * `@/server/clerk/facade`) and the client hooks (`@/lib/auth/use-session`,
 * `@/lib/auth/clerk-client`) produce the same shape, which is what every
 * component and service in the app reads.
 */

/** The subset of a Better Auth session (server `getSession` or client `useSession`) that is read. */
export interface BetterAuthSessionResult {
  session: { expiresAt: Date | string };
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    emailVerified?: boolean | null;
    emailVerifiedAt?: Date | string | null;
    role?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };
}

const toDate = (value: Date | string | number | null | undefined): Date | null => {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toRole = (value: string | null | undefined): UserRole =>
  value === UserRole.admin ? UserRole.admin : UserRole.user;

/**
 * `emailVerified` prefers the Auth.js timestamp (read through the
 * `emailVerifiedAt` additional field) and falls back to the boolean flag.
 */
export function mapBetterAuthSession(result: BetterAuthSessionResult | null): Session | null {
  if (!result?.user?.id) return null;
  const { user, session } = result;
  const role = toRole(user.role);
  const emailVerified = toDate(user.emailVerifiedAt) ?? (user.emailVerified ? new Date() : null);
  const expires = toDate(session.expiresAt) ?? new Date(0);

  const mapped: User = {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
    emailVerified,
    role,
    isAdmin: role === UserRole.admin,
    createdAt: toDate(user.createdAt) ?? undefined,
    updatedAt: toDate(user.updatedAt) ?? undefined,
  };

  return { user: mapped, expires: expires.toISOString() };
}

/**
 * The subset of a Clerk user that is read. Structural on purpose: the server's
 * `User` from `@clerk/nextjs/server` (timestamps as epoch milliseconds) and the
 * client's `UserResource` from `@clerk/nextjs` (timestamps as `Date`) both fit,
 * and this file never imports Clerk.
 */
export interface ClerkUserLike {
  id: string;
  primaryEmailAddress?: {
    emailAddress: string;
    verification?: { status?: string | null } | null;
  } | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  /** `role` is read from here; set it per user in the Clerk dashboard. */
  publicMetadata?: Record<string, unknown> | null;
  createdAt?: Date | number | null;
  updatedAt?: Date | number | null;
}

const clerkName = (user: ClerkUserLike): string | null => {
  if (user.fullName) return user.fullName;
  const joined = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return joined || null;
};

/**
 * Clerk user -> Auth.js `Session`. `expiresAt` is the session's expiry: the
 * `exp` claim (seconds) on the server, `session.expireAt` on the client.
 * `role` comes from `publicMetadata.role` when it is `"admin"`; everything
 * else is a plain user.
 */
export function mapClerkSession(
  user: ClerkUserLike | null | undefined,
  expiresAt: Date | number | string | null | undefined
): Session | null {
  if (!user?.id) return null;
  const roleValue = user.publicMetadata?.role;
  const role = toRole(typeof roleValue === "string" ? roleValue : null);
  const primary = user.primaryEmailAddress ?? null;
  const expires =
    typeof expiresAt === "number" && expiresAt < 1e12
      ? new Date(expiresAt * 1000) // a JWT `exp` claim is in seconds
      : (toDate(expiresAt) ?? new Date(0));

  const mapped: User = {
    id: user.id,
    email: primary?.emailAddress ?? "",
    name: clerkName(user),
    image: user.imageUrl || null,
    emailVerified: primary?.verification?.status === "verified" ? new Date() : null,
    role,
    isAdmin: role === UserRole.admin,
    createdAt: toDate(user.createdAt) ?? undefined,
    updatedAt: toDate(user.updatedAt) ?? undefined,
  };

  return { user: mapped, expires: expires.toISOString() };
}
