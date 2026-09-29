"use client";

import type { Session } from "next-auth";
import { routes } from "@/config/routes";

/**
 * Stub: Clerk is not installed.
 *
 * `@/lib/auth/use-session` dispatches to this module when `AUTH_STRATEGY=clerk`.
 * The `clerk` registry item (`npx shadcn add @shipkit/clerk`) overwrites this
 * file with the real hooks on top of `@clerk/nextjs`. Until then every session
 * reads as signed out.
 */

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface UseSessionOptions<R extends boolean> {
  required: R;
  onUnauthenticated?: () => void;
}

interface SignInOptionsLike {
  redirectTo?: string;
  callbackUrl?: string;
  redirect?: boolean;
  [key: string]: unknown;
}

interface SignOutOptionsLike {
  redirectTo?: string;
  callbackUrl?: string;
  redirect?: boolean;
}

const navigate = (url: string) => {
  if (typeof window !== "undefined") window.location.href = url;
};

export function useClerkSession<R extends boolean>(_options?: UseSessionOptions<R>) {
  const status: SessionStatus = "unauthenticated";
  const update = async (): Promise<Session | null> => null;
  return { data: null as Session | null, status, update };
}

export async function clerkSignIn(_provider?: string, options?: SignInOptionsLike) {
  const url = routes.auth.signIn;
  if (options?.redirect !== false) navigate(url);
  return { ok: true, error: undefined, code: undefined, status: 200, url };
}

export async function clerkSignOut(options?: SignOutOptionsLike) {
  const url = options?.redirectTo ?? options?.callbackUrl ?? routes.home;
  if (options?.redirect !== false) navigate(url);
  return { url };
}
