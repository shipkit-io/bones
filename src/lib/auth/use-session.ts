"use client";

import type { Session } from "next-auth";
import {
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
  useSession as useNextAuthSession,
} from "next-auth/react";
import { useCallback, useEffect, useMemo } from "react";
import { routes } from "@/config/routes";
import { isBetterAuthActive } from "@/lib/auth/auth-strategy";
import { type BetterAuthSessionResult, mapBetterAuthSession } from "@/lib/auth/session-mapping";
import { authClient } from "@/lib/better-auth/client";

/**
 * Client-side session with the `next-auth/react` API, whichever strategy is on.
 *
 * Components import `useSession`, `signIn` and `signOut` from here instead of
 * `next-auth/react`. Under Auth.js they are the `next-auth/react` originals.
 * Under Better Auth, `useSession` reads `authClient.useSession()` and maps it
 * to `{ data: { user, expires } | null, status, update }`, and `signIn` /
 * `signOut` call the Better Auth client. The strategy is fixed for the life of
 * the bundle, so the choice is made once at module load.
 *
 * `SessionProvider` still comes from `next-auth/react`; it wraps the tree and
 * is harmless when Better Auth owns the session.
 */

type NextAuthUseSession = typeof useNextAuthSession;
type NextAuthSignIn = typeof nextAuthSignIn;
type NextAuthSignOut = typeof nextAuthSignOut;

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

/** `next-auth/react` declares this but does not export it. */
interface UseSessionOptions<R extends boolean> {
  required: R;
  onUnauthenticated?: () => void;
}

interface SignInOptionsLike {
  redirectTo?: string;
  callbackUrl?: string;
  redirect?: boolean;
  email?: string;
  password?: string;
  [key: string]: unknown;
}

interface SignOutOptionsLike {
  redirectTo?: string;
  callbackUrl?: string;
  redirect?: boolean;
}

/** Providers Better Auth's client can start itself; anything else falls back to Auth.js. */
const CREDENTIALS_PROVIDER = "credentials";
const AUTHJS_ONLY_PROVIDERS = new Set(["guest", "resend", "email", "nodemailer"]);

const currentPage = () => (typeof window === "undefined" ? routes.home : window.location.href);

const navigate = (url: string) => {
  if (typeof window !== "undefined") window.location.href = url;
};

function useBetterAuthSession<R extends boolean>(options?: UseSessionOptions<R>) {
  const { data, isPending, refetch } = authClient.useSession();
  const session = useMemo(
    () => mapBetterAuthSession(data as unknown as BetterAuthSessionResult | null),
    [data]
  );
  const status: SessionStatus = isPending
    ? "loading"
    : session
      ? "authenticated"
      : "unauthenticated";

  const update = useCallback(async (): Promise<Session | null> => {
    await refetch();
    const fresh = await authClient.getSession();
    return mapBetterAuthSession(fresh.data);
  }, [refetch]);

  const required = options?.required === true;
  const onUnauthenticated = options?.onUnauthenticated;
  useEffect(() => {
    if (!required || status !== "unauthenticated") return;
    if (onUnauthenticated) onUnauthenticated();
    else navigate(routes.auth.signIn);
  }, [required, status, onUnauthenticated]);

  return { data: session, status, update };
}

export const useSession = (
  isBetterAuthActive() ? useBetterAuthSession : useNextAuthSession
) as NextAuthUseSession;

async function betterAuthSignIn(provider: string | undefined, options?: SignInOptionsLike) {
  const callbackURL = options?.redirectTo ?? options?.callbackUrl ?? currentPage();
  const shouldRedirect = options?.redirect !== false;

  if (provider === CREDENTIALS_PROVIDER) {
    const { data, error } = await authClient.signIn.email({
      email: typeof options?.email === "string" ? options.email : "",
      password: typeof options?.password === "string" ? options.password : "",
      callbackURL,
    });
    if (!error && shouldRedirect) navigate(callbackURL);
    return {
      ok: !error,
      error: error?.message ?? error?.code,
      code: error?.code,
      status: error?.status ?? 200,
      url: data ? callbackURL : null,
    };
  }

  const { data, error } = await authClient.signIn.social({
    provider: provider ?? "github",
    callbackURL,
    disableRedirect: !shouldRedirect,
  });
  return {
    ok: !error,
    error: error?.message ?? error?.code,
    code: error?.code,
    status: error?.status ?? 200,
    url: data?.url ?? null,
  };
}

/**
 * `signIn(provider, options)` from `next-auth/react`, or the Better Auth
 * client when it is active. Social providers start the OAuth flow, and
 * `"credentials"` signs in with email and password. `redirect: false` returns
 * the `{ ok, error, url }` response instead of navigating. Auth.js-only
 * providers (`guest`, `resend`) always go through Auth.js.
 */
export const signIn = (async (
  provider?: string,
  options?: SignInOptionsLike | FormData,
  authorizationParams?: unknown
) => {
  const opts =
    options instanceof FormData ? (Object.fromEntries(options) as SignInOptionsLike) : options;
  if (!isBetterAuthActive() || (provider && AUTHJS_ONLY_PROVIDERS.has(provider))) {
    return (nextAuthSignIn as (...args: unknown[]) => Promise<unknown>)(
      provider,
      options,
      authorizationParams
    );
  }
  return betterAuthSignIn(provider, opts);
}) as NextAuthSignIn;

/**
 * `signOut(options)` from `next-auth/react`, or the Better Auth client when it
 * is active: revokes the session, then navigates to `callbackUrl` /
 * `redirectTo` (default home) unless `redirect: false`.
 */
export const signOut = (async (options?: SignOutOptionsLike) => {
  if (!isBetterAuthActive()) {
    return (nextAuthSignOut as (...args: unknown[]) => Promise<unknown>)(options);
  }
  const url = options?.redirectTo ?? options?.callbackUrl ?? routes.home;
  await authClient.signOut();
  if (options?.redirect !== false) navigate(url);
  return { url };
}) as NextAuthSignOut;
