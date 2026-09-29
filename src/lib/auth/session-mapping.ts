import type { Session } from "next-auth";
import { type User, UserRole } from "@/types/user";

/**
 * Better Auth session -> Auth.js `Session`.
 *
 * Pure and dependency-free so both the server facade (`@/server/better-auth/facade`)
 * and the client hook (`@/lib/auth/use-session`) produce the same shape, which is
 * what every component and service in the app reads.
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

const toDate = (value: Date | string | null | undefined): Date | null => {
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
