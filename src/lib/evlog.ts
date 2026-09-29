/**
 * evlog trial feature flag (LAC-3361).
 *
 * evlog is young (single maintainer, ~7 months old), so it is opt-in and must
 * never become load-bearing: everything evlog-related checks this flag first,
 * and rip-out is deleting this file plus its call sites.
 *
 * This module is imported from isomorphic code (logger), so it cannot import
 * features-config.ts — that file's env mirroring side effects must stay out of
 * the client bundle. The flag re-implements the same truthy check instead.
 */

const TRUTHY_FLAG_VALUES = ["true", "1", "yes", "on", "enable", "enabled"];

/**
 * Whether the evlog trial is enabled. Always false in the browser — the trial
 * covers server-side logging, request-error capture, and audit events only.
 */
export function isEvlogEnabled(): boolean {
  if (typeof window !== "undefined") return false;
  const value = process.env.ENABLE_EVLOG ?? process.env.NEXT_PUBLIC_FEATURE_EVLOG_ENABLED ?? "";
  return TRUTHY_FLAG_VALUES.includes(value.toLowerCase().trim());
}
