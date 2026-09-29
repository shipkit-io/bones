/**
 * Build-time Feature Flag Detection
 *
 * This file runs during the build process to detect which buildTimeFeatures are enabled
 * based on environment variables. It generates flags for injection into the client bundle.
 *
 * Every feature is declared once in `features-table.ts`. This file evaluates that
 * table against the environment. `scripts/doctor.ts` reads the same table to
 * explain which features are on, waiting on a key, or off.
 *
 * @note This runs BEFORE T3 Env validation, so we use raw process.env
 */

import {
  FEATURE_DEFINITIONS,
  FEATURE_KEYS,
  type FeatureAlternative,
  type FeatureKey,
  featureFlagName,
} from "./features-table";

export {
  FEATURE_DEFINITIONS,
  FEATURE_KEYS,
  type FeatureAlternative,
  type FeatureDefinition,
  type FeatureKey,
  featureFlagName,
} from "./features-table";

/** Anything shaped like process.env. */
export type EnvSource = Record<string, string | undefined>;

// ======== Utility Functions =========

function isSet(env: EnvSource, name: string): boolean {
  const value = env[name];
  return typeof value === "string" && value.trim().length > 0;
}

function isTrue(env: EnvSource, name: string): boolean {
  const value = env[name]?.toLowerCase().trim();
  return ["true", "1", "yes", "on", "enable", "enabled"].includes(value ?? "");
}

/**
 * Check if environment variable exists and has a value
 */
function hasEnv(...names: string[]): boolean {
  return names.every((name) => isSet(process.env, name));
}

function hasAnyEnv(...names: string[]): boolean {
  return names.some((name) => isSet(process.env, name));
}

/**
 * Check if environment variable is enabled (true/1/yes/on)
 */
export function envIsTrue(name: string): boolean {
  return isTrue(process.env, name);
}

// ======== Public Env Mirrors =========
/**
 * !!!!!!! IMPORTANT !!!!!!!
 * ! THESE VARIABLES ARE EXPOSED TO THE CLIENT !
 * ! USE WITH CAUTION !
 * Mirror server-side public keys to NEXT_PUBLIC_ variants at build time.
 * This allows users to set e.g. STRIPE_PUBLISHABLE_KEY and have
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY generated automatically for the client bundle.
 *
 * Security: Only whitelisted keys that are intended to be public are mirrored.
 */
const PUBLIC_ENV_BASE_KEYS = [
  // Which auth implementation is active; not a secret, and client code reads it
  "AUTH_STRATEGY",
  // Core integrations that expect public keys
  "BUILDER_API_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  // Analytics / Telemetry
  "POSTHOG_KEY",
  "UMAMI_WEBSITE_ID",
  "DATAFAST_WEBSITE_ID",
  "DATAFAST_DOMAIN",
  "STATSIG_CLIENT_KEY",
  "GOOGLE_ANALYTICS_ID",
  "GOOGLE_GTM_ID",
  // Consent / Privacy
  "C15T_URL",
  "VERCEL_INTEGRATION_SLUG",
];

function getEnvValue(name: string): string | undefined {
  const upper = name.toUpperCase();
  // Check exact key first, then fall back to case-insensitive scan
  const value =
    process.env[name] ??
    process.env[upper] ??
    Object.entries(process.env).find(([k]) => k.toUpperCase() === upper)?.[1];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mirrorPublicEnvVariables(): Record<`NEXT_PUBLIC_${string}`, string> {
  const mirrored: Record<string, string> = {};

  for (const base of PUBLIC_ENV_BASE_KEYS) {
    const publicKey = `NEXT_PUBLIC_${base}` as const;

    // Prefer explicitly provided NEXT_PUBLIC_ value, fall back to base key
    const value = getEnvValue(publicKey) ?? getEnvValue(base);

    if (value) {
      // Always set both forms on process.env so hasEnv(), T3 Env runtimeEnv,
      // and downstream feature detection all see the values consistently
      process.env[base] = value;
      process.env[publicKey] = value;

      // Return NEXT_PUBLIC_ form for next.config.ts env injection (client bundle)
      mirrored[base] = value;
      mirrored[publicKey] = value;
    }
  }

  return mirrored;
}

// Execute mirroring immediately so feature detection below can see NEXT_PUBLIC_* keys
export const buildTimePublicEnv = mirrorPublicEnvVariables();

// ======== Preferred AI Provider =========

export type AiProviderId = "claude-code" | "codex" | "gemini";

export interface AiProvider {
  id: AiProviderId;
  /** Resolved value of the relevant API key for this provider. */
  env: string | undefined;
}

/*
 * Generic preferred AI provider resolved at build time.
 * Carries a single resolved `env` value, whichever API key is present.
 * Downstream configs (e.g. react-grab-config) import this and layer feature-specific details on top.
 * The DEVTOOLS_REACT_GRAB row in the table mirrors this order.
 */
export const preferredAiProvider: AiProvider | undefined = (() => {
  if (hasEnv("ANTHROPIC_API_KEY") && !envIsTrue("DISABLE_ANTHROPIC"))
    return { id: "claude-code", env: getEnvValue("ANTHROPIC_API_KEY") };
  if (hasEnv("OPENAI_API_KEY") && !envIsTrue("DISABLE_OPENAI"))
    return { id: "codex", env: getEnvValue("OPENAI_API_KEY") };
  if (hasAnyEnv("GOOGLE_GEMINI_API_KEY", "GOOGLE_API_KEY"))
    return {
      id: "gemini",
      env: getEnvValue("GOOGLE_GEMINI_API_KEY") ?? getEnvValue("GOOGLE_API_KEY"),
    };
  return undefined;
})();

// ======== Feature Detection =========

/** True when an `env` condition from the table holds. */
export function envConditionHolds(
  env: EnvSource,
  condition: readonly string[] | { readonly any: readonly string[] }
): boolean {
  if ("any" in condition) return condition.any.some((name) => isSet(env, name));
  return condition.every((name) => isSet(env, name));
}

/**
 * Evaluate the feature table against an environment.
 * Returns `{ DATABASE_ENABLED: boolean, ... }` in table order.
 * Pure: pass any env map (tests, the doctor script) or nothing for process.env.
 */
export function computeBuildTimeFeatures(env: EnvSource = process.env): Record<string, boolean> {
  const memo = new Map<FeatureKey, boolean>();

  const isOn = (key: FeatureKey): boolean => {
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    const def = FEATURE_DEFINITIONS[key];
    let on = true;
    if (def.env) on = on && envConditionHolds(env, def.env);
    if (def.enable) on = on && isTrue(env, def.enable);
    if (def.disable) on = on && !isTrue(env, def.disable);
    if (def.requires) on = on && def.requires.every((dep) => isOn(dep));
    if (def.anyOf) on = on && def.anyOf.some((alt) => alternativeHolds(alt));
    if (def.devOnly) on = on && env.NODE_ENV !== "production";
    memo.set(key, on);
    return on;
  };

  const alternativeHolds = (alt: FeatureAlternative<FeatureKey>): boolean => {
    if (typeof alt === "string") return isOn(alt);
    if ("any" in alt) return envConditionHolds(env, alt);
    if ("env" in alt) return envConditionHolds(env, alt.env);
    return isTrue(env, alt.enable);
  };

  const result: Record<string, boolean> = {};
  for (const key of FEATURE_KEYS) result[featureFlagName(key)] = isOn(key);
  return result;
}

const buildTimeFeatures = computeBuildTimeFeatures(process.env);

// ======== Generate Feature Flags =========

export { buildTimeFeatures };

/** All feature flag key names (e.g. "DATABASE_ENABLED", "AUTH_GITHUB_ENABLED") */
export const featureFlagNames = Object.keys(buildTimeFeatures);

/**
 * You probably don't need to use this.
 * Build-time flags for injection into client bundle via Next.js env vars
 * Use string values as process.env converts everything to strings
 * @internal
 */
export const buildTimeFeatureFlags = Object.fromEntries(
  Object.entries(buildTimeFeatures)
    .filter(([, enabled]) => enabled)
    .map(([key]) => [`NEXT_PUBLIC_FEATURE_${key}`, "true"])
) as Record<`NEXT_PUBLIC_FEATURE_${string}`, string>;

// Always export AUTH_ENABLED regardless of its value for client-side checks
buildTimeFeatureFlags.NEXT_PUBLIC_FEATURE_AUTH_ENABLED ??= buildTimeFeatures.AUTH_ENABLED
  ? "true"
  : "false";

// Always export AUTH_METHODS_ENABLED regardless of its value (used client-side)
buildTimeFeatureFlags.NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED ??=
  buildTimeFeatures.AUTH_METHODS_ENABLED ? "true" : "false";
