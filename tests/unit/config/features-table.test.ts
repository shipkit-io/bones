import { describe, expect, it } from "vitest";

import {
  FEATURE_DEFINITIONS,
  FEATURE_KEYS,
  computeBuildTimeFeatures,
  featureFlagNames,
} from "../../../src/config/features-config";

/**
 * The flag set on main before the table refactor. If a key is added, removed or
 * reordered, update this list on purpose: `next.config.ts`, `src/env.ts` and every
 * `NEXT_PUBLIC_FEATURE_*` consumer depend on these names.
 */
const EXPECTED_FLAGS = [
  "DATABASE_ENABLED",
  "PAYLOAD_ENABLED",
  "BUILDER_ENABLED",
  "MDX_ENABLED",
  "PWA_ENABLED",
  "EVLOG_ENABLED",
  "DEVTOOLS_ENABLED",
  "DEVTOOLS_FONT_SELECTOR_ENABLED",
  "DEVTOOLS_REACT_GRAB_ENABLED",
  "LIGHT_MODE_ENABLED",
  "DARK_MODE_ENABLED",
  "HAPTICS_ENABLED",
  "BETTER_AUTH_ENABLED",
  "AUTH_CLERK_ENABLED",
  "AUTH_STACK_ENABLED",
  "AUTH_CREDENTIALS_ENABLED",
  "AUTH_RESEND_ENABLED",
  "AUTH_BITBUCKET_ENABLED",
  "AUTH_DISCORD_ENABLED",
  "AUTH_GITHUB_ENABLED",
  "AUTH_GITLAB_ENABLED",
  "AUTH_GOOGLE_ENABLED",
  "AUTH_TWITTER_ENABLED",
  "AUTH_VERCEL_ENABLED",
  "AUTH_GUEST_ENABLED",
  "SUPABASE_AUTH_ENABLED",
  "AUTH_JS_ENABLED",
  "AUTH_ENABLED",
  "AUTH_METHODS_ENABLED",
  "GITHUB_API_ENABLED",
  "GOOGLE_SERVICE_ACCOUNT_ENABLED",
  "OPENAI_ENABLED",
  "ANTHROPIC_ENABLED",
  "LEMONSQUEEZY_ENABLED",
  "POLAR_ENABLED",
  "STRIPE_ENABLED",
  "S3_ENABLED",
  "VERCEL_BLOB_ENABLED",
  "REDIS_ENABLED",
  "VERCEL_INTEGRATION_ENABLED",
  "POSTHOG_ENABLED",
  "UMAMI_ENABLED",
  "DATAFAST_ENABLED",
  "STATSIG_ENABLED",
  "GOOGLE_ANALYTICS_ENABLED",
  "GOOGLE_TAG_MANAGER_ENABLED",
  "C15T_ENABLED",
  "CONSENT_MANAGER_ENABLED",
  "TURNSTILE_ENABLED",
  "FILE_UPLOAD_ENABLED",
];

/** Flags that are on by default with no env at all. */
const DEFAULT_ON = [
  "MDX_ENABLED",
  "PWA_ENABLED",
  "LIGHT_MODE_ENABLED",
  "DARK_MODE_ENABLED",
  "HAPTICS_ENABLED",
];

/** Flags that are on for `env`, sorted; order is covered by the key-set test. */
function onFlags(env: Record<string, string>): string[] {
  return Object.entries(computeBuildTimeFeatures(env))
    .filter(([, on]) => on)
    .map(([key]) => key)
    .sort();
}

function expectOn(env: Record<string, string>, flags: string[]): void {
  expect(onFlags(env)).toEqual([...flags].sort());
}

describe("feature table", () => {
  it("emits exactly the flag set from main, in order", () => {
    expect(Object.keys(computeBuildTimeFeatures({}))).toEqual(EXPECTED_FLAGS);
    expect(featureFlagNames).toEqual(EXPECTED_FLAGS);
    expect(FEATURE_KEYS.map((key) => `${key}_ENABLED`)).toEqual(EXPECTED_FLAGS);
  });

  it("only references real feature keys in requires and anyOf", () => {
    const keys = new Set<string>(FEATURE_KEYS);
    for (const [key, def] of Object.entries(FEATURE_DEFINITIONS)) {
      expect(def.label, `${key} needs a label`).toBeTruthy();
      for (const dep of def.requires ?? []) {
        expect(keys.has(dep), `${key} requires ${dep}`).toBe(true);
      }
      for (const alt of def.anyOf ?? []) {
        if (typeof alt === "string") expect(keys.has(alt), `${key} anyOf ${alt}`).toBe(true);
      }
    }
  });

  it("is deterministic and pure", () => {
    const env = { DATABASE_URL: "postgres://x", APP_SECRET: "s" };
    expect(computeBuildTimeFeatures(env)).toEqual(computeBuildTimeFeatures(env));
    expect(env).toEqual({ DATABASE_URL: "postgres://x", APP_SECRET: "s" });
  });
});

describe("buildTimeFeatures snapshots", () => {
  it("empty env: only the defaults are on", () => {
    expectOn({}, DEFAULT_ON);
  });

  it("whitespace and empty values do not count", () => {
    expectOn({ DATABASE_URL: "   ", APP_SECRET: "" }, DEFAULT_ON);
  });

  it("APP_SECRET plus DATABASE_URL turns on Payload, Better Auth and credentials login", () => {
    expectOn({ DATABASE_URL: "postgres://x", APP_SECRET: "s" }, [
      ...DEFAULT_ON,
      "DATABASE_ENABLED",
      "PAYLOAD_ENABLED",
      "BETTER_AUTH_ENABLED",
      "AUTH_CREDENTIALS_ENABLED",
      "AUTH_JS_ENABLED",
      "AUTH_ENABLED",
      "AUTH_METHODS_ENABLED",
    ]);
  });

  it("APP_SECRET without a database leaves Payload and Better Auth off", () => {
    expectOn({ APP_SECRET: "s" }, DEFAULT_ON);
  });

  it("DISABLE_* wins over keys", () => {
    expectOn({ DATABASE_URL: "postgres://x", APP_SECRET: "s", DISABLE_PAYLOAD: "true" }, [
      ...DEFAULT_ON,
      "DATABASE_ENABLED",
      "BETTER_AUTH_ENABLED",
      "AUTH_ENABLED",
      "AUTH_METHODS_ENABLED",
    ]);
    expectOn({ DISABLE_MDX: "1", DISABLE_HAPTICS: "yes" }, [
      "PWA_ENABLED",
      "LIGHT_MODE_ENABLED",
      "DARK_MODE_ENABLED",
    ]);
  });

  it("an OAuth provider needs both keys", () => {
    expectOn({ AUTH_GITHUB_ID: "id" }, DEFAULT_ON);
    expectOn({ AUTH_GITHUB_ID: "id", AUTH_GITHUB_SECRET: "secret" }, [
      ...DEFAULT_ON,
      "AUTH_GITHUB_ENABLED",
      "AUTH_JS_ENABLED",
      "AUTH_ENABLED",
      "AUTH_METHODS_ENABLED",
    ]);
  });

  it("magic link is development only", () => {
    expectOn({ RESEND_API_KEY: "re_x" }, [
      ...DEFAULT_ON,
      "AUTH_RESEND_ENABLED",
      "AUTH_JS_ENABLED",
      "AUTH_ENABLED",
      "AUTH_METHODS_ENABLED",
    ]);
    expectOn({ RESEND_API_KEY: "re_x", NODE_ENV: "production" }, DEFAULT_ON);
  });

  it("guest login counts as auth but not as a sign-in method", () => {
    expectOn({ ENABLE_AUTH_GUEST: "true" }, [...DEFAULT_ON, "AUTH_GUEST_ENABLED", "AUTH_ENABLED"]);
  });

  it("React Grab needs devtools, its own flag and an AI key", () => {
    const base = { ENABLE_DEVTOOLS: "true", ENABLE_REACT_GRAB: "true" };
    const devtools = ["DEVTOOLS_ENABLED", "DEVTOOLS_FONT_SELECTOR_ENABLED"];
    expectOn(base, [...DEFAULT_ON, ...devtools]);
    expectOn({ ...base, GOOGLE_API_KEY: "g" }, [
      ...DEFAULT_ON,
      ...devtools,
      "DEVTOOLS_REACT_GRAB_ENABLED",
    ]);
    expectOn({ ...base, ANTHROPIC_API_KEY: "a", DISABLE_ANTHROPIC: "true" }, [
      ...DEFAULT_ON,
      ...devtools,
    ]);
    expectOn({ ENABLE_REACT_GRAB: "true", OPENAI_API_KEY: "o" }, [...DEFAULT_ON, "OPENAI_ENABLED"]);
  });

  it("consent manager turns on with c15t or its own flag", () => {
    expectOn({ NEXT_PUBLIC_C15T_URL: "https://c" }, [
      ...DEFAULT_ON,
      "C15T_ENABLED",
      "CONSENT_MANAGER_ENABLED",
    ]);
    expectOn({ ENABLE_CONSENT_MANAGER: "on" }, [...DEFAULT_ON, "CONSENT_MANAGER_ENABLED"]);
    expectOn({ NEXT_PUBLIC_C15T_URL: "https://c", DISABLE_CONSENT_MANAGER: "true" }, [
      ...DEFAULT_ON,
      "C15T_ENABLED",
    ]);
  });

  it("file upload follows either storage provider", () => {
    expectOn({ VERCEL_BLOB_READ_WRITE_TOKEN: "t" }, [
      ...DEFAULT_ON,
      "VERCEL_BLOB_ENABLED",
      "FILE_UPLOAD_ENABLED",
    ]);
    expectOn({ AWS_REGION: "r", AWS_ACCESS_KEY_ID: "k", AWS_SECRET_ACCESS_KEY: "s" }, DEFAULT_ON);
  });
});
