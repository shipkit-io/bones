import { env } from "@/env";

/**
 * Authentication Strategy Types
 */
export type AuthStrategy = "clerk" | "stack" | "authjs" | "better-auth" | "guest";

/**
 * The explicit `AUTH_STRATEGY` choice, if any.
 *
 * The client bundle only sees the `NEXT_PUBLIC_` mirror (features-config.ts
 * copies it at build time); the server can read either, and falls back to the
 * raw variable in scripts and tests where next.config never ran.
 *
 * The accepted values are the `AUTH_STRATEGY` enum in `src/env.ts`. The result
 * is widened to `AuthStrategy` so a project whose `env.ts` predates one of the
 * strategies (a Bones checkout before the `clerk` item, say) still compiles.
 */
function configuredStrategy(): AuthStrategy | undefined {
  const isServer = typeof window === "undefined";
  const configured = env.NEXT_PUBLIC_AUTH_STRATEGY ?? (isServer ? env.AUTH_STRATEGY : undefined);
  return configured as AuthStrategy | undefined;
}

/**
 * Whether any Auth.js provider is switched on.
 *
 * This has to be `.some`, not a `??` chain. These flags are optional booleans,
 * so an explicit `NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED=false` is non-nullish
 * and a `??` chain stops right there, reporting guest mode even when GitHub or
 * Google is switched on.
 */
function hasAuthJsProvider(): boolean {
  return [
    env.NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED,
    env.NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED,
    env.NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED,
    env.NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED,
    env.NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED,
    env.NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED,
    env.NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED,
    env.NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED,
  ].some(Boolean);
}

/**
 * Something only an Auth.js deployment would set: a session strategy override,
 * or the Payload-backed credentials provider.
 */
function hasAuthJsSignal(): boolean {
  const isServer = typeof window === "undefined";
  const sessionStrategy = isServer ? env.NEXTAUTH_SESSION_STRATEGY : undefined;
  return Boolean(sessionStrategy) || env.NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED === true;
}

/**
 * Determines which authentication strategy to use.
 *
 * Priority: explicit AUTH_STRATEGY > Better Auth > Auth.js > Guest
 *
 * - `AUTH_STRATEGY=clerk` picks Clerk when it is configured
 *   (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY plus CLERK_SECRET_KEY). Clerk is a paid,
 *   hosted service, so it is never picked automatically: the keys alone do
 *   nothing until this variable says so.
 * - `AUTH_STRATEGY=better-auth` picks Better Auth when it is configured
 *   (DATABASE_URL plus BETTER_AUTH_SECRET or APP_SECRET).
 * - `AUTH_STRATEGY=authjs` keeps the Auth.js provider detection.
 * - Unset: Better Auth when it is configured and nothing Auth.js-specific is,
 *   otherwise the Auth.js detection. That makes Better Auth the default for a
 *   new project while an existing Auth.js deployment keeps working untouched.
 *
 * A strategy that is selected but not configured falls through to the
 * detection below, the same way `AUTH_STRATEGY=better-auth` without a database
 * does, so a half-configured deployment degrades to Auth.js or guest mode
 * instead of a provider that cannot start.
 */
export function getAuthStrategy(): AuthStrategy {
  const configured = configuredStrategy();
  const clerkReady = env.NEXT_PUBLIC_FEATURE_AUTH_CLERK_ENABLED === true;
  const betterAuthReady = env.NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED === true;

  if (configured === "clerk" && clerkReady) {
    return "clerk";
  }

  if (configured === "better-auth" && betterAuthReady) {
    return "better-auth";
  }

  if (configured === undefined && betterAuthReady && !hasAuthJsSignal()) {
    return "better-auth";
  }

  if (hasAuthJsProvider()) {
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
 * Check if Better Auth is the active auth strategy
 */
export function isBetterAuthActive(): boolean {
  return getAuthStrategy() === "better-auth";
}

/**
 * Check if guest mode is active
 */
export function isGuestModeActive(): boolean {
  return getAuthStrategy() === "guest";
}
