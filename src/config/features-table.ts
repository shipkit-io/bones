/**
 * Feature table
 *
 * Every ShipKit feature is declared once here. `features-config.ts` turns this
 * table into the build-time flags (`DATABASE_ENABLED`, `AUTH_GITHUB_ENABLED`,
 * ...) and `scripts/doctor.ts` reads it to explain which features are on,
 * which are waiting on a key, and which key is missing.
 *
 * A feature is ON when every condition that is present holds:
 *   - `env`: all listed keys are set (or, with `{ any: [...] }`, at least one is)
 *   - `enable`: the opt-in flag is truthy (true/1/yes/on)
 *   - `disable`: the kill switch is NOT truthy
 *   - `requires`: every listed feature is on
 *   - `anyOf`: at least one alternative holds (a feature key, an env group, or an enable flag)
 *   - `devOnly`: NODE_ENV is not "production"
 *
 * A feature with no conditions except `disable` is on by default (MDX, PWA, themes).
 * Insertion order is the order flags are emitted, so keep it stable.
 */

export interface EnvAnyGroup {
  /** At least one of these keys must be set. */
  readonly any: readonly string[];
}

export type FeatureAlternative<K extends string = string> =
  K | EnvAnyGroup | { readonly env: readonly string[] } | { readonly enable: string };

export interface FeatureDefinition<K extends string = string> {
  /** Human name printed by `shipkit doctor`. */
  readonly label: string;
  /** Keys that must all be set, or an `{ any: [...] }` group where one is enough. */
  readonly env?: readonly string[] | EnvAnyGroup;
  /** Opt-in flag, for example `ENABLE_DEVTOOLS`. */
  readonly enable?: string;
  /** Kill switch, for example `DISABLE_STRIPE`. */
  readonly disable?: string;
  /** Features that must all be on first. */
  readonly requires?: readonly K[];
  /** At least one of these must hold. Used for umbrella flags and fallbacks. */
  readonly anyOf?: readonly FeatureAlternative<K>[];
  /** Never on when NODE_ENV is "production". */
  readonly devOnly?: boolean;
  /** Where the missing key comes from, or the feature guide. */
  readonly docs?: string;
}

/** Secrets that can be derived from a single APP_SECRET. */
const APP_SECRET = "APP_SECRET";

const AUTH_JS_PROVIDERS = [
  "AUTH_CREDENTIALS",
  "AUTH_RESEND",
  "AUTH_BITBUCKET",
  "AUTH_DISCORD",
  "AUTH_GITHUB",
  "AUTH_GITLAB",
  "AUTH_GOOGLE",
  "AUTH_TWITTER",
  "AUTH_VERCEL",
] as const;

const table = {
  // Core
  DATABASE: {
    label: "Database",
    env: ["DATABASE_URL"],
    docs: "https://console.neon.tech",
  },
  PAYLOAD: {
    label: "Payload CMS",
    env: { any: ["PAYLOAD_SECRET", APP_SECRET] },
    disable: "DISABLE_PAYLOAD",
    requires: ["DATABASE"],
    docs: "https://shipkit.io/docs/integrations/payload",
  },
  BUILDER: {
    label: "Builder.io",
    env: ["NEXT_PUBLIC_BUILDER_API_KEY"],
    disable: "DISABLE_BUILDER",
    docs: "https://builder.io/account/space",
  },
  MDX: { label: "MDX content", disable: "DISABLE_MDX" },
  PWA: { label: "PWA", disable: "DISABLE_PWA" },
  EVLOG: { label: "evlog logging trial", enable: "ENABLE_EVLOG" },

  // Developer tools
  DEVTOOLS: { label: "Developer tools", enable: "ENABLE_DEVTOOLS" },
  DEVTOOLS_FONT_SELECTOR: { label: "Devtools font selector", requires: ["DEVTOOLS"] },
  DEVTOOLS_REACT_GRAB: {
    label: "Devtools React Grab",
    enable: "ENABLE_REACT_GRAB",
    requires: ["DEVTOOLS"],
    // Mirrors preferredAiProvider: Anthropic, then OpenAI, then a Gemini key.
    anyOf: ["ANTHROPIC", "OPENAI", { any: ["GOOGLE_GEMINI_API_KEY", "GOOGLE_API_KEY"] }],
    docs: "https://react-grab.com/blog/agent",
  },

  // UI and theme
  LIGHT_MODE: { label: "Light mode", disable: "DISABLE_LIGHT_MODE" },
  DARK_MODE: { label: "Dark mode", disable: "DISABLE_DARK_MODE" },
  HAPTICS: { label: "Haptics", disable: "DISABLE_HAPTICS" },

  // Authentication
  BETTER_AUTH: {
    label: "Better Auth",
    env: { any: ["BETTER_AUTH_SECRET", APP_SECRET] },
    disable: "DISABLE_BETTER_AUTH",
    requires: ["DATABASE"],
    docs: "https://shipkit.io/docs/features/authentication",
  },
  AUTH_CLERK: {
    label: "Clerk auth",
    env: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"],
    disable: "DISABLE_AUTH_CLERK",
    docs: "https://dashboard.clerk.com",
  },
  AUTH_STACK: {
    label: "Stack Auth",
    env: ["STACK_PROJECT_ID", "STACK_PUBLISHABLE_CLIENT_KEY", "STACK_SECRET_SERVER_KEY"],
    disable: "DISABLE_AUTH_STACK",
    docs: "https://app.stack-auth.com",
  },
  AUTH_CREDENTIALS: {
    label: "Password login (Auth.js)",
    disable: "DISABLE_AUTH_CREDENTIALS",
    requires: ["PAYLOAD"],
  },
  AUTH_RESEND: {
    // On in production. This was `devOnly` to stop a stray key emailing from
    // production, but the cost was that anything forking this repo and setting
    // RESEND_API_KEY got a working magic link in dev and a sign-in page with no
    // way in once deployed. Abuse control moved to the allowlist in
    // `src/server/auth-js/magic-link-allowlist.ts`, applied from the `signIn`
    // callback, which Auth.js runs before `sendVerificationRequest`.
    // RESEND_FROM_EMAIL is required as well — it has to be a sender on a
    // Resend-verified domain, and without it the send fails at Resend anyway,
    // so a missing one should read as "not configured" rather than a 500.
    label: "Magic link login (Resend)",
    env: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
    disable: "DISABLE_AUTH_RESEND",
    docs: "https://resend.com/api-keys",
  },
  AUTH_BITBUCKET: {
    label: "Bitbucket login",
    env: ["AUTH_BITBUCKET_ID", "AUTH_BITBUCKET_SECRET"],
    disable: "DISABLE_AUTH_BITBUCKET",
    docs: "https://bitbucket.org/account/settings/app-passwords/",
  },
  AUTH_DISCORD: {
    label: "Discord login",
    env: ["AUTH_DISCORD_ID", "AUTH_DISCORD_SECRET"],
    disable: "DISABLE_AUTH_DISCORD",
    docs: "https://discord.com/developers/applications",
  },
  AUTH_GITHUB: {
    label: "GitHub login",
    env: ["AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"],
    disable: "DISABLE_AUTH_GITHUB",
    docs: "https://github.com/settings/developers",
  },
  AUTH_GITLAB: {
    label: "GitLab login",
    env: ["AUTH_GITLAB_ID", "AUTH_GITLAB_SECRET"],
    disable: "DISABLE_AUTH_GITLAB",
    docs: "https://gitlab.com/-/user_settings/applications",
  },
  AUTH_GOOGLE: {
    label: "Google login",
    env: ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"],
    disable: "DISABLE_AUTH_GOOGLE",
    docs: "https://console.cloud.google.com/apis/credentials",
  },
  AUTH_TWITTER: {
    label: "Twitter login",
    env: ["AUTH_TWITTER_ID", "AUTH_TWITTER_SECRET"],
    disable: "DISABLE_AUTH_TWITTER",
    docs: "https://developer.x.com/en/portal/dashboard",
  },
  AUTH_VERCEL: {
    label: "Vercel account linking",
    env: ["VERCEL_CLIENT_ID", "VERCEL_CLIENT_SECRET"],
    disable: "DISABLE_AUTH_VERCEL",
    docs: "https://vercel.com/dashboard/integrations/console",
  },
  AUTH_GUEST: { label: "Guest login", enable: "ENABLE_AUTH_GUEST" },
  SUPABASE_AUTH: {
    label: "Supabase auth",
    env: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    disable: "DISABLE_SUPABASE_AUTH",
    docs: "https://supabase.com/dashboard",
  },
  AUTH_JS: { label: "Auth.js", anyOf: [...AUTH_JS_PROVIDERS] },
  AUTH: {
    label: "Authentication",
    anyOf: ["AUTH_JS", "BETTER_AUTH", "AUTH_CLERK", "AUTH_STACK", "SUPABASE_AUTH", "AUTH_GUEST"],
  },
  // Real sign-in methods (excludes guest and Vercel account linking)
  AUTH_METHODS: {
    label: "Sign-in methods",
    anyOf: [
      "AUTH_CREDENTIALS",
      "AUTH_RESEND",
      "AUTH_BITBUCKET",
      "AUTH_DISCORD",
      "AUTH_GITHUB",
      "AUTH_GITLAB",
      "AUTH_GOOGLE",
      "AUTH_TWITTER",
      "BETTER_AUTH",
      "AUTH_CLERK",
      "AUTH_STACK",
      "SUPABASE_AUTH",
    ],
  },

  // External services
  GITHUB_API: {
    label: "GitHub API",
    env: ["GITHUB_ACCESS_TOKEN"],
    disable: "DISABLE_GITHUB_API",
    docs: "https://github.com/settings/tokens",
  },
  GOOGLE_SERVICE_ACCOUNT: {
    label: "Google service account",
    env: ["GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY"],
    disable: "DISABLE_GOOGLE_SERVICE_ACCOUNT",
    docs: "https://console.cloud.google.com/iam-admin/serviceaccounts",
  },
  OPENAI: {
    label: "OpenAI",
    env: ["OPENAI_API_KEY"],
    disable: "DISABLE_OPENAI",
    docs: "https://platform.openai.com/api-keys",
  },
  ANTHROPIC: {
    label: "Anthropic",
    env: ["ANTHROPIC_API_KEY"],
    disable: "DISABLE_ANTHROPIC",
    docs: "https://console.anthropic.com/settings/keys",
  },

  // Payments
  LEMONSQUEEZY: {
    label: "Lemon Squeezy payments",
    env: ["LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_STORE_ID"],
    disable: "DISABLE_LEMONSQUEEZY",
    docs: "https://app.lemonsqueezy.com/settings/api",
  },
  POLAR: {
    label: "Polar payments",
    env: ["POLAR_ACCESS_TOKEN"],
    disable: "DISABLE_POLAR",
    docs: "https://polar.sh/settings",
  },
  STRIPE: {
    label: "Stripe payments",
    env: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
    disable: "DISABLE_STRIPE",
    docs: "https://dashboard.stripe.com/apikeys",
  },

  // Storage
  S3: {
    label: "S3 storage",
    env: ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_BUCKET_NAME"],
    disable: "DISABLE_S3",
    docs: "https://console.aws.amazon.com/iam",
  },
  VERCEL_BLOB: {
    label: "Vercel Blob storage",
    env: ["VERCEL_BLOB_READ_WRITE_TOKEN"],
    disable: "DISABLE_VERCEL_BLOB",
    docs: "https://vercel.com/docs/storage/vercel-blob",
  },

  // Infrastructure
  REDIS: {
    label: "Redis (Upstash)",
    env: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    disable: "DISABLE_REDIS",
    docs: "https://console.upstash.com",
  },
  VERCEL_INTEGRATION: {
    label: "Vercel integration",
    env: ["VERCEL_INTEGRATION_SLUG", "VERCEL_CLIENT_ID", "VERCEL_CLIENT_SECRET"],
    disable: "DISABLE_VERCEL_INTEGRATION",
    docs: "https://vercel.com/dashboard/integrations/console",
  },

  // Analytics
  POSTHOG: {
    label: "PostHog analytics",
    env: ["NEXT_PUBLIC_POSTHOG_KEY"],
    disable: "DISABLE_POSTHOG",
    docs: "https://app.posthog.com/settings/project",
  },
  UMAMI: {
    label: "Umami analytics",
    env: ["NEXT_PUBLIC_UMAMI_WEBSITE_ID"],
    disable: "DISABLE_UMAMI",
    docs: "https://cloud.umami.is",
  },
  DATAFAST: {
    label: "DataFast analytics",
    env: ["NEXT_PUBLIC_DATAFAST_WEBSITE_ID"],
    disable: "DISABLE_DATAFAST",
    docs: "https://datafa.st",
  },
  STATSIG: {
    label: "Statsig",
    env: ["NEXT_PUBLIC_STATSIG_CLIENT_KEY"],
    disable: "DISABLE_STATSIG",
    docs: "https://console.statsig.com",
  },
  GOOGLE_ANALYTICS: {
    label: "Google Analytics",
    env: ["NEXT_PUBLIC_GOOGLE_ANALYTICS_ID"],
    disable: "DISABLE_GOOGLE_ANALYTICS",
    docs: "https://analytics.google.com",
  },
  GOOGLE_TAG_MANAGER: {
    label: "Google Tag Manager",
    env: ["NEXT_PUBLIC_GOOGLE_GTM_ID"],
    disable: "DISABLE_GOOGLE_TAG_MANAGER",
    docs: "https://tagmanager.google.com",
  },

  // Consent
  C15T: {
    label: "c15t consent",
    env: ["NEXT_PUBLIC_C15T_URL"],
    disable: "DISABLE_C15T",
    docs: "https://consent.io",
  },
  CONSENT_MANAGER: {
    label: "Consent manager",
    anyOf: ["C15T", { enable: "ENABLE_CONSENT_MANAGER" }],
    disable: "DISABLE_CONSENT_MANAGER",
  },

  // Cloudflare Turnstile (CAPTCHA); no kill switch today
  TURNSTILE: {
    label: "Cloudflare Turnstile",
    env: ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
    docs: "https://dash.cloudflare.com/?to=/:account/turnstile",
  },

  // Composite
  FILE_UPLOAD: { label: "File upload", anyOf: ["S3", "VERCEL_BLOB"] },
} as const satisfies Record<string, FeatureDefinition>;

export type FeatureKey = keyof typeof table;

/**
 * The table, typed so `requires` and `anyOf` may only name real feature keys.
 * (Assigning after `FeatureKey` exists avoids a circular type.)
 */
export const FEATURE_DEFINITIONS: Record<FeatureKey, FeatureDefinition<FeatureKey>> = table;

/** Table keys in declaration order. */
export const FEATURE_KEYS = Object.keys(table) as FeatureKey[];

/** `DATABASE` -> `DATABASE_ENABLED`, the name used in `buildTimeFeatures`. */
export function featureFlagName(key: FeatureKey): `${FeatureKey}_ENABLED` {
  return `${key}_ENABLED`;
}
