/**
 * Allowlist for magic-link (Resend) sign-in.
 *
 * Magic link works in production: anyone can type an address into the form and
 * make the app email it. When `AUTH_ALLOWED_EMAILS` is set, unknown addresses
 * are refused in the Auth.js `signIn` callback, which runs before
 * `sendVerificationRequest`, so no email is ever sent.
 *
 * An unset allowlist allows everyone, which is the right default for a
 * boilerplate — it keeps a fresh clone working out of the box. Anything
 * deploying this publicly should set `AUTH_ALLOWED_EMAILS`.
 */

/**
 * Parse `AUTH_ALLOWED_EMAILS` into normalized entries.
 * Comma-separated; entries may be full addresses ("alice@example.com")
 * or domains ("corp.io" / "@corp.io").
 */
export function parseSignInAllowlist(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

/**
 * Check an address against the allowlist. An empty/unset allowlist allows everyone.
 */
// Read process.env at call time (not @/env, which snapshots at import) so tests
// and runtime config changes are picked up.
export function isSignInEmailAllowed(
  email: string,
  raw: string | undefined | null = process.env.AUTH_ALLOWED_EMAILS
): boolean {
  const entries = parseSignInAllowlist(raw);
  if (entries.length === 0) return true;

  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1];

  return entries.some((entry) => {
    if (entry.startsWith("@")) return entry.slice(1) === domain;
    if (entry.includes("@")) return entry === normalized;
    return entry === domain;
  });
}
