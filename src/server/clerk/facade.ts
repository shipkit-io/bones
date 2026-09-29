import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { routes } from "@/config/routes";

/**
 * Stub: Clerk is not installed.
 *
 * `@/server/auth` dispatches to this module when `AUTH_STRATEGY=clerk`. The
 * `clerk` registry item (`npx shadcn add @shipkit/clerk`) overwrites this file
 * with the real facade on top of `@clerk/nextjs/server`, and brings the
 * provider, the request proxy and the client hooks with it. Until then Clerk
 * cannot sign anyone in: every session reads as signed out.
 */

export async function getClerkSession(): Promise<Session | null> {
  return null;
}

interface SignInOptions {
  redirectTo?: string;
  callbackUrl?: string;
  redirect?: boolean;
  [key: string]: unknown;
}

const toOptions = (options?: FormData | SignInOptions): SignInOptions =>
  options instanceof FormData ? Object.fromEntries(options) : (options ?? {});

export async function clerkSignIn(_provider?: string, options?: FormData | SignInOptions) {
  const url = routes.auth.signIn;
  if (toOptions(options).redirect !== false) redirect(url);
  return { ok: true, url };
}

export async function clerkSignOut(options?: FormData | SignInOptions) {
  const opts = toOptions(options);
  const url = typeof opts.redirectTo === "string" ? opts.redirectTo : routes.home;
  if (opts.redirect !== false) redirect(url);
  return { url };
}
