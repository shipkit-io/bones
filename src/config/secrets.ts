/**
 * Deterministic Secret Derivation Utilities (Pure)
 *
 * Allows a single `APP_SECRET` to deterministically derive integration-specific
 * secrets (e.g., `AUTH_SECRET`, `PAYLOAD_SECRET`, `BETTER_AUTH_SECRET`).
 *
 * - No process.env mutation here. These helpers are pure and used by
 *   build-time configuration to inject values via Next.js `env`.
 */

import crypto from "node:crypto";
import { BASE_URL } from "./base-url";

const hasValue = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * The fallback below hashes only BASE_URL, which is public. Anyone who knows
 * the site's URL can reproduce it, and therefore every secret derived from it.
 * That is acceptable for local development and tests, where the alternative is
 * making every contributor invent secrets before `bun dev` works. It is never
 * acceptable in production, so production refuses to use it.
 */
export function getMasterAppSecret(): string {
  const provided = process.env.APP_SECRET;
  if (hasValue(provided)) {
    return provided;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[SECURITY] APP_SECRET is not set and a secret would be derived from the public BASE_URL. " +
        "Anyone who knows this site's URL could reconstruct it and forge sessions. " +
        "Set APP_SECRET (`openssl rand -hex 32`), or set AUTH_SECRET, PAYLOAD_SECRET and " +
        "BETTER_AUTH_SECRET explicitly."
    );
  }

  const input = `${BASE_URL}|shipkit|app-secret|v1`;
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function deriveSecret(name: string): string {
  const master = getMasterAppSecret();
  const material = `${BASE_URL}|${name}|v1`;
  return crypto.createHmac("sha256", master).update(material).digest("hex");
}

export function getDerivedSecrets(): Record<string, string> {
  const explicit = {
    AUTH_SECRET: process.env.AUTH_SECRET,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  };

  // A deployment that sets every secret explicitly never needs a master, so do
  // not demand APP_SECRET from it.
  if (Object.values(explicit).every(hasValue)) {
    return {
      APP_SECRET: process.env.APP_SECRET ?? "",
      ...(explicit as Record<string, string>),
    };
  }

  // `??` would keep an empty string, which is how an unset Vercel variable
  // arrives. Fall back on anything blank, not just null/undefined.
  return {
    APP_SECRET: getMasterAppSecret(),
    AUTH_SECRET: hasValue(explicit.AUTH_SECRET) ? explicit.AUTH_SECRET : deriveSecret("auth"),
    PAYLOAD_SECRET: hasValue(explicit.PAYLOAD_SECRET)
      ? explicit.PAYLOAD_SECRET
      : deriveSecret("payload"),
    BETTER_AUTH_SECRET: hasValue(explicit.BETTER_AUTH_SECRET)
      ? explicit.BETTER_AUTH_SECRET
      : deriveSecret("better-auth"),
  };
}
