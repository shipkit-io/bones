import { APIError } from "better-auth/api";
import type { Auth } from "@/server/better-auth/config";
import type { Session } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BASE_URL } from "@/config/base-url";
import { routes } from "@/config/routes";
import { STATUS_CODES } from "@/config/status-codes";
import { type BetterAuthSessionResult, mapBetterAuthSession } from "@/lib/auth/session-mapping";
import { logger } from "@/lib/logger";

export { type BetterAuthSessionResult, mapBetterAuthSession };

/**
 * Better Auth behind the `@/server/auth` facade.
 *
 * Everything in the app reads sessions through `auth()` from `@/server/auth`
 * and expects the Auth.js shape (`{ user, expires }` with the augmented
 * `User`). This module produces that shape from Better Auth so the rest of the
 * app does not know which strategy is active.
 *
 * `@/server/better-auth/config` builds the Better Auth instance at import time
 * and throws without a database, so it is imported lazily here: this file is
 * always loaded by the facade, but the instance only when the strategy is on.
 */

async function getBetterAuth(): Promise<Auth> {
  const { auth } = await import("@/server/better-auth/config");
  return auth;
}

/**
 * Current session from the request cookies, in the app's shape. `null` when
 * signed out or when Better Auth cannot be reached; the caller decides whether
 * that means a redirect.
 */
export async function getBetterAuthSession(): Promise<Session | null> {
  try {
    const auth = await getBetterAuth();
    const result = await auth.api.getSession({ headers: await headers() });
    return mapBetterAuthSession(result);
  } catch (error) {
    logger.error("Better Auth: failed to read session", error);
    return null;
  }
}

interface SignInOptions {
  redirectTo?: string;
  callbackUrl?: string;
  redirect?: boolean;
  email?: string;
  password?: string;
  [key: string]: unknown;
}

const toOptions = (options?: FormData | SignInOptions): SignInOptions =>
  options instanceof FormData ? Object.fromEntries(options) : (options ?? {});

const absoluteUrl = (path: string) => new URL(path, BASE_URL).toString();

/** Better Auth reports a bad email or password as a 401 `APIError`. */
const isCredentialsError = (error: unknown) =>
  error instanceof APIError && (error.statusCode === 401 || error.statusCode === 403);

/**
 * `signIn(provider, options)` with Auth.js semantics: a social provider starts
 * the OAuth flow and redirects to it, `"credentials"` signs in with email and
 * password. `redirect: false` returns `{ ok, url }` instead of redirecting.
 */
export async function betterAuthSignIn(provider?: string, options?: FormData | SignInOptions) {
  const opts = toOptions(options);
  const redirectTo = opts.redirectTo ?? opts.callbackUrl ?? routes.home;
  const shouldRedirect = opts.redirect !== false;
  const auth = await getBetterAuth();
  const requestHeaders = await headers();

  if (!provider || provider === "credentials") {
    const email = typeof opts.email === "string" ? opts.email : "";
    const password = typeof opts.password === "string" ? opts.password : "";
    try {
      await auth.api.signInEmail({
        body: { email, password, callbackURL: absoluteUrl(redirectTo) },
        headers: requestHeaders,
      });
    } catch (error) {
      if (isCredentialsError(error)) {
        if (!shouldRedirect) return { ok: false, error: STATUS_CODES.CREDENTIALS.message };
        throw new Error(STATUS_CODES.CREDENTIALS.message);
      }
      throw error;
    }
    if (shouldRedirect) redirect(redirectTo);
    return { ok: true, url: redirectTo };
  }

  const result = await auth.api.signInSocial({
    body: { provider, callbackURL: absoluteUrl(redirectTo), disableRedirect: true },
    headers: requestHeaders,
  });
  const url = result?.url;
  if (!url) {
    throw new Error(`Better Auth: provider "${provider}" returned no authorization URL`);
  }
  if (shouldRedirect) redirect(url);
  return { ok: true, url };
}

/**
 * `signOut(options)` with Auth.js semantics: clears the session cookie, then
 * redirects unless `redirect: false`.
 */
export async function betterAuthSignOut(options?: SignInOptions) {
  const opts = toOptions(options);
  const redirectTo = opts.redirectTo ?? routes.home;
  const auth = await getBetterAuth();
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    // No session to revoke is not a failure for the person signing out.
    logger.warn("Better Auth: sign-out reported an error", error);
  }
  if (opts.redirect !== false) redirect(redirectTo);
  return { url: redirectTo };
}

interface CredentialsInput {
  email: string;
  password: string;
  redirect?: boolean;
  redirectTo?: string;
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof APIError ? (error.body?.message ?? fallback) : fallback;

/**
 * Email and password flows for the server actions in `src/server/actions/auth.ts`.
 * These replace the Payload-backed `AuthService` methods when Better Auth is active.
 */
export const betterAuthCredentials = {
  async signIn({
    email,
    password,
    redirect: shouldRedirect = false,
    redirectTo,
  }: CredentialsInput) {
    return betterAuthSignIn("credentials", {
      email,
      password,
      redirect: shouldRedirect,
      redirectTo: redirectTo ?? routes.home,
    });
  },

  /** Creates the user row, an account row with the password hash, and a session. */
  async signUp({ email, password }: CredentialsInput) {
    const auth = await getBetterAuth();
    try {
      const result = await auth.api.signUpEmail({
        body: { email, password, name: email },
        headers: await headers(),
      });
      const user = (result as { user?: { id: string; email: string; name?: string | null } }).user;
      if (!user) return { ok: false as const, error: "Sign up failed" };
      return { ok: true as const, user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
      if (error instanceof APIError) {
        return { ok: false as const, error: errorMessage(error, "Sign up failed") };
      }
      throw error;
    }
  },

  /** Sends the reset link. Always resolves ok, so an unknown email cannot be probed. */
  async forgotPassword(email: string) {
    const auth = await getBetterAuth();
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: absoluteUrl(routes.auth.resetPassword) },
      headers: await headers(),
    });
    return { ok: true as const };
  },

  async resetPassword(token: string, password: string) {
    const auth = await getBetterAuth();
    try {
      await auth.api.resetPassword({
        body: { token, newPassword: password },
        headers: await headers(),
      });
    } catch (error) {
      throw new Error(errorMessage(error, STATUS_CODES.AUTH_ERROR.message));
    }
    return { ok: true as const };
  },
};
