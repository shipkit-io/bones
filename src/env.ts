import { vercel } from "@t3-oss/env-core/presets-zod";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Helper function for boolean feature flags defined at build time
const zBooleanFeatureFlag = z
  .enum(["true", "false"])
  .transform((val) => val === "true")
  .optional();

/**
 * Environment variable configuration using T3 Env
 * @see https://env.t3.gg
 *
 * This file defines and validates all environment variables used in the application.
 * Variables are grouped by purpose and documented for clarity.
 */
export const env = createEnv({
  /**
   * T3 Env ships the following presets out of the box, all importable from the /presets entrypoint.
   *
   * - vercel
   * - neonVercel
   * - uploadthing
   * - render
   * - railway
   * - fly.io
   * - netlify
   */
  extends: [vercel()], // !TODO

  /**
   * Server-side environment variables schema
   * These variables are only available on the server and not exposed to the client
   */
  server: {
    // ======== Core Environment ========
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // ======== Original Feature Flags (Disable flags etc.) ========
    DISABLE_LOGGING: z.string().optional(),
    DISABLE_ERROR_LOGGING: z.string().optional(),
    DISABLE_BUILDER: z.string().optional(), // Disable Builder CMS

    // ======== App Secret (Master) ========
    APP_SECRET: z.string().optional(),

    // ======== Content Management ========
    // Payload CMS
    ENABLE_PAYLOAD: z.string().optional(), // Enable Payload CMS
    PAYLOAD_SECRET: z.string().optional(),
    PAYLOAD_PUBLIC_DRAFT_SECRET: z.string().optional(),
    PAYLOAD_AUTO_SEED: z.string().optional(),
    PAYLOAD_SEED_FORCE: z.string().optional(),

    // ======== Database ========
    DATABASE_URL: z.string().url().optional(),
    DB_PREFIX: z.string().default("db"),

    // ======== Authentication ========
    // Which server-side auth implementation owns sessions. Unset lets
    // src/lib/auth/auth-strategy.ts pick from the configured features.
    // "clerk" is never picked automatically (it needs a paid Clerk account).
    AUTH_STRATEGY: z.enum(["better-auth", "authjs", "clerk"]).optional(),
    AUTH_SECRET: z.string().optional(),
    AUTH_URL: z.string().url().optional(),
    // ======== Credentials (requires DB) ========
    AUTH_CREDENTIALS_ENABLED: z.string().optional(),
    DEBUG_AUTH: z.string().optional(),
    NEXTAUTH_SESSION_STRATEGY: z.string().optional(),

    // ======== Better Auth Configuration ========
    BETTER_AUTH_BASE_URL: z.string().url().optional(),
    BETTER_AUTH_SECRET: z.string().optional(),

    // Email and Magic login
    RESEND_API_KEY: z.string().optional(), // Added for waitlist welcome email
    RESEND_AUDIENCE_ID: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().optional(),
    // Comma-separated emails and/or domains ("alice@corp.io, @corp.io") allowed to
    // sign in via magic link. Unset = everyone.
    AUTH_ALLOWED_EMAILS: z.string().optional(),

    // OAuth Providers
    AUTH_DISCORD_ID: z.string().optional(),
    AUTH_DISCORD_SECRET: z.string().optional(),
    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    AUTH_BITBUCKET_ID: z.string().optional(),
    AUTH_BITBUCKET_SECRET: z.string().optional(),
    AUTH_GITLAB_ID: z.string().optional(),
    AUTH_GITLAB_SECRET: z.string().optional(),
    AUTH_TWITTER_ID: z.string().optional(),
    AUTH_TWITTER_SECRET: z.string().optional(),

    // Admin
    ADMIN_EMAIL: z.string().optional(),
    ADMIN_DOMAINS: z.string().optional(),

    // ======== Stack Auth ========
    STACK_PROJECT_ID: z.string().optional(),
    STACK_PUBLISHABLE_CLIENT_KEY: z.string().optional(),
    STACK_SECRET_SERVER_KEY: z.string().optional(),

    // ======== Supabase Authentication ========
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

    // ======== Clerk Authentication (alternative to Auth.js) ========
    CLERK_SECRET_KEY: z.string().optional(),
    CLERK_WEBHOOK_SECRET: z.string().optional(),

    // ======== External Services ========
    // GitHub
    GITHUB_ACCESS_TOKEN: z.string().optional(),
    GITHUB_REPO_OWNER: z.string().optional(),
    GITHUB_REPO_NAME: z.string().optional(),

    // Google
    GOOGLE_CLIENT_EMAIL: z.string().optional(),
    GOOGLE_PRIVATE_KEY: z.string().optional(),
    GOOGLE_FONTS_API_KEY: z.string().optional(),

    // AI Services
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    DEEPSEEK_API_KEY: z.string().optional(),
    ELEVENLABS_API_KEY: z.string().optional(),
    FAL_API_KEY: z.string().optional(),
    FIRECRAWL_API_KEY: z.string().optional(),
    GOOGLE_GEMINI_API_KEY: z.string().optional(),
    HUGGINGFACE_API_KEY: z.string().optional(),
    PERPLEXITY_API_KEY: z.string().optional(),
    REPLICATE_API_KEY: z.string().optional(),

    // Trading APIs
    ALPACA_API_KEY: z.string().optional(),
    ALPACA_SECRET_KEY: z.string().optional(),
    ALPACA_BASE_URL: z.string().url().optional(),
    ALPHA_VANTAGE_API_KEY: z.string().optional(),
    STOCKTWITS_ACCESS_TOKEN: z.string().optional(),

    // Social Media
    TWITTER_API_KEY: z.string().optional(),
    TWITTER_API_SECRET: z.string().optional(),
    TWITTER_ACCESS_TOKEN: z.string().optional(),
    TWITTER_ACCESS_TOKEN_SECRET: z.string().optional(),

    // Payments
    LEMONSQUEEZY_API_KEY: z.string().optional(),
    LEMONSQUEEZY_STORE_ID: z.string().optional(),
    LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),
    LEMONSQUEEZY_SANDBOX: z.string().optional(),

    // Polar
    POLAR_ACCESS_TOKEN: z.string().optional(),
    POLAR_PLATFORM_URL: z.string().optional(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_API_VERSION: z.string().optional(),

    // Storage
    AWS_REGION: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_BUCKET_NAME: z.string().optional(),

    // Caching
    UPSTASH_REDIS_REST_URL: z.string().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // Cloudflare Turnstile (CAPTCHA)
    TURNSTILE_SECRET_KEY: z.string().optional(),

    // Deployment
    VERCEL_ACCESS_TOKEN: z.string().optional(),
    VERCEL_CLIENT_ID: z.string().optional(),
    VERCEL_CLIENT_SECRET: z.string().optional(),
    VERCEL_INTEGRATION_SLUG: z.string().optional(),
    VERCEL_BLOB_READ_WRITE_TOKEN: z.string().optional(),

    // Preview / Feature-Flag Overrides
    PREVIEW_SECRET: z.string().optional(),
  },

  /**
   * Client-side environment variables schema
   * These variables are exposed to the client and must be prefixed with NEXT_PUBLIC_
   */
  client: {
    // Consent Manager
    NEXT_PUBLIC_C15T_URL: z.string().optional(),

    // Content Management
    NEXT_PUBLIC_BUILDER_API_KEY: z.string().optional(),

    // Analytics
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),

    // Polar Products
    NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID: z.string().optional(),
    NEXT_PUBLIC_POLAR_ONE_TIME_PRICE_ID: z.string().optional(),

    // Stripe
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

    // Clerk Authentication (alternative to Auth.js)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),

    // Mirror of AUTH_STRATEGY (features-config.ts) so client code agrees with the server
    NEXT_PUBLIC_AUTH_STRATEGY: z.enum(["better-auth", "authjs", "clerk"]).optional(),

    // ======== Supabase Authentication ========
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),

    // Cloudflare Turnstile (CAPTCHA)
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),

    NEXT_PUBLIC_VERCEL_INTEGRATION_SLUG: z.string().optional(),

    // GitHub OAuth (for deployment integrations)
    NEXT_PUBLIC_GITHUB_CLIENT_ID: z.string().optional(),

    // ======== Build-Time Feature Flags (Derived in next.config.ts) ========
    NEXT_PUBLIC_FEATURE_DATABASE_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_BUILDER_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_MDX_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_PWA_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_LIGHT_MODE_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_DARK_MODE_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_HAPTICS_ENABLED: zBooleanFeatureFlag,

    // Better Auth Feature Flags
    NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: zBooleanFeatureFlag,

    // Auth.js Feature Flags
    NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_GUEST_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_CLERK_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_STACK_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_VERCEL_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_SUPABASE_AUTH_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_JS_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_AUTH_ENABLED: zBooleanFeatureFlag,

    // External Services
    NEXT_PUBLIC_FEATURE_GITHUB_API_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_GOOGLE_SERVICE_ACCOUNT_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_OPENAI_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_ANTHROPIC_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_POLAR_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_S3_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_REDIS_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_VERCEL_API_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_VERCEL_BLOB_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_VERCEL_INTEGRATION_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_STRIPE_ENABLED: zBooleanFeatureFlag,

    // Analytics
    NEXT_PUBLIC_FEATURE_POSTHOG_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_UMAMI_ENABLED: zBooleanFeatureFlag,

    // DataFast Analytics
    NEXT_PUBLIC_FEATURE_DATAFAST_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_DATAFAST_WEBSITE_ID: z.string().optional(),
    NEXT_PUBLIC_DATAFAST_DOMAIN: z.string().optional(),

    // Google Analytics
    NEXT_PUBLIC_FEATURE_GOOGLE_ANALYTICS_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),

    // Google Tag Manager
    NEXT_PUBLIC_FEATURE_GOOGLE_TAG_MANAGER_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_GOOGLE_GTM_ID: z.string().optional(),

    // Statsig
    NEXT_PUBLIC_FEATURE_STATSIG_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_STATSIG_CLIENT_KEY: z.string().optional(),

    // Consent Manager
    NEXT_PUBLIC_FEATURE_C15T_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_CONSENT_MANAGER_ENABLED: zBooleanFeatureFlag,

    // File Upload
    NEXT_PUBLIC_FEATURE_FILE_UPLOAD_ENABLED: zBooleanFeatureFlag,

    // Cloudflare Turnstile (CAPTCHA)
    NEXT_PUBLIC_FEATURE_TURNSTILE_ENABLED: zBooleanFeatureFlag,

    // Dev tools
    NEXT_PUBLIC_FEATURE_EVLOG_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_DEVTOOLS_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_DEVTOOLS_FONT_SELECTOR_ENABLED: zBooleanFeatureFlag,
    NEXT_PUBLIC_FEATURE_DEVTOOLS_REACT_GRAB_ENABLED: zBooleanFeatureFlag,
  },

  /**
   * Runtime environment mapping
   * Maps schema variables to actual process.env values
   */
  runtimeEnv: {
    // Core Environment
    NODE_ENV: process.env.NODE_ENV,

    // Original Feature Flags
    DISABLE_LOGGING: process.env.DISABLE_LOGGING,
    DISABLE_ERROR_LOGGING: process.env.DISABLE_ERROR_LOGGING,
    DISABLE_BUILDER: process.env.DISABLE_BUILDER,
    ENABLE_PAYLOAD: process.env.ENABLE_PAYLOAD,

    // App Secret (Master)
    APP_SECRET: process.env.APP_SECRET,

    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    DB_PREFIX: process.env.DB_PREFIX,

    // Authentication
    AUTH_STRATEGY: process.env.AUTH_STRATEGY,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_CREDENTIALS_ENABLED: process.env.AUTH_CREDENTIALS_ENABLED,
    DEBUG_AUTH: process.env.DEBUG_AUTH,
    NEXTAUTH_SESSION_STRATEGY: process.env.NEXTAUTH_SESSION_STRATEGY,

    // Better Auth
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_BASE_URL: process.env.BETTER_AUTH_BASE_URL,

    // Resend
    RESEND_API_KEY: process.env.RESEND_API_KEY, // Added for waitlist welcome email
    RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    AUTH_ALLOWED_EMAILS: process.env.AUTH_ALLOWED_EMAILS,

    // OAuth Providers
    AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
    AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_BITBUCKET_ID: process.env.AUTH_BITBUCKET_ID,
    AUTH_BITBUCKET_SECRET: process.env.AUTH_BITBUCKET_SECRET,
    AUTH_GITLAB_ID: process.env.AUTH_GITLAB_ID,
    AUTH_GITLAB_SECRET: process.env.AUTH_GITLAB_SECRET,
    AUTH_TWITTER_ID: process.env.AUTH_TWITTER_ID,
    AUTH_TWITTER_SECRET: process.env.AUTH_TWITTER_SECRET,

    // Admin
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_DOMAINS: process.env.ADMIN_DOMAINS,

    // Stack Auth
    STACK_PROJECT_ID: process.env.STACK_PROJECT_ID,
    STACK_PUBLISHABLE_CLIENT_KEY: process.env.STACK_PUBLISHABLE_CLIENT_KEY,
    STACK_SECRET_SERVER_KEY: process.env.STACK_SECRET_SERVER_KEY,

    // Supabase Authentication
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // Clerk Authentication (alternative to Auth.js)
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,

    // Content Management
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    PAYLOAD_PUBLIC_DRAFT_SECRET: process.env.PAYLOAD_PUBLIC_DRAFT_SECRET,
    PAYLOAD_AUTO_SEED: process.env.PAYLOAD_AUTO_SEED,
    PAYLOAD_SEED_FORCE: process.env.PAYLOAD_SEED_FORCE,

    // External Services (Server-side keys)
    GITHUB_ACCESS_TOKEN: process.env.GITHUB_ACCESS_TOKEN,
    GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
    GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_FONTS_API_KEY: process.env.GOOGLE_FONTS_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    FAL_API_KEY: process.env.FAL_API_KEY,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    REPLICATE_API_KEY: process.env.REPLICATE_API_KEY,
    ALPACA_API_KEY: process.env.ALPACA_API_KEY,
    ALPACA_SECRET_KEY: process.env.ALPACA_SECRET_KEY,
    ALPACA_BASE_URL: process.env.ALPACA_BASE_URL,
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
    STOCKTWITS_ACCESS_TOKEN: process.env.STOCKTWITS_ACCESS_TOKEN,
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_API_SECRET: process.env.TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
    LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
    LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
    LEMONSQUEEZY_SANDBOX: process.env.LEMONSQUEEZY_SANDBOX,
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_PLATFORM_URL: process.env.POLAR_PLATFORM_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_API_VERSION: process.env.STRIPE_API_VERSION,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    VERCEL_ACCESS_TOKEN: process.env.VERCEL_ACCESS_TOKEN,
    VERCEL_CLIENT_ID: process.env.VERCEL_CLIENT_ID,
    VERCEL_CLIENT_SECRET: process.env.VERCEL_CLIENT_SECRET,
    VERCEL_INTEGRATION_SLUG: process.env.VERCEL_INTEGRATION_SLUG,
    VERCEL_BLOB_READ_WRITE_TOKEN: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    PREVIEW_SECRET: process.env.PREVIEW_SECRET,

    // Consent Manager
    NEXT_PUBLIC_C15T_URL: process.env.NEXT_PUBLIC_C15T_URL,

    // Client-side variables (Original)
    NEXT_PUBLIC_BUILDER_API_KEY: process.env.NEXT_PUBLIC_BUILDER_API_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID: process.env.NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID,
    NEXT_PUBLIC_POLAR_ONE_TIME_PRICE_ID: process.env.NEXT_PUBLIC_POLAR_ONE_TIME_PRICE_ID,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,

    // Supabase Authentication
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_VERCEL_INTEGRATION_SLUG: process.env.NEXT_PUBLIC_VERCEL_INTEGRATION_SLUG,
    NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,

    // Build-Time Feature Flags (Client-side)
    NEXT_PUBLIC_FEATURE_DATABASE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_DATABASE_ENABLED,
    NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED: process.env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED,
    NEXT_PUBLIC_FEATURE_BUILDER_ENABLED: process.env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED,
    NEXT_PUBLIC_FEATURE_MDX_ENABLED: process.env.NEXT_PUBLIC_FEATURE_MDX_ENABLED,
    NEXT_PUBLIC_FEATURE_PWA_ENABLED: process.env.NEXT_PUBLIC_FEATURE_PWA_ENABLED,
    NEXT_PUBLIC_FEATURE_LIGHT_MODE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_LIGHT_MODE_ENABLED,
    NEXT_PUBLIC_FEATURE_DARK_MODE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_DARK_MODE_ENABLED,
    NEXT_PUBLIC_FEATURE_HAPTICS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_HAPTICS_ENABLED,

    // Better Auth Feature Flags
    NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: process.env.NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED,

    // Clerk Authentication (alternative to Auth.js)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,

    NEXT_PUBLIC_AUTH_STRATEGY: process.env.NEXT_PUBLIC_AUTH_STRATEGY,

    // Auth.js Feature Flags
    NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_GUEST_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_GUEST_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_CLERK_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_CLERK_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_STACK_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_STACK_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_VERCEL_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_VERCEL_ENABLED,
    NEXT_PUBLIC_FEATURE_SUPABASE_AUTH_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_SUPABASE_AUTH_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_JS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_JS_ENABLED,
    NEXT_PUBLIC_FEATURE_AUTH_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_ENABLED,
    NEXT_PUBLIC_FEATURE_GITHUB_API_ENABLED: process.env.NEXT_PUBLIC_FEATURE_GITHUB_API_ENABLED,
    NEXT_PUBLIC_FEATURE_GOOGLE_SERVICE_ACCOUNT_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_GOOGLE_SERVICE_ACCOUNT_ENABLED,
    NEXT_PUBLIC_FEATURE_OPENAI_ENABLED: process.env.NEXT_PUBLIC_FEATURE_OPENAI_ENABLED,
    NEXT_PUBLIC_FEATURE_ANTHROPIC_ENABLED: process.env.NEXT_PUBLIC_FEATURE_ANTHROPIC_ENABLED,
    NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED: process.env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED,
    NEXT_PUBLIC_FEATURE_POLAR_ENABLED: process.env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED,
    NEXT_PUBLIC_FEATURE_S3_ENABLED: process.env.NEXT_PUBLIC_FEATURE_S3_ENABLED,
    NEXT_PUBLIC_FEATURE_REDIS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_REDIS_ENABLED,
    NEXT_PUBLIC_FEATURE_VERCEL_API_ENABLED: process.env.NEXT_PUBLIC_FEATURE_VERCEL_API_ENABLED,
    NEXT_PUBLIC_FEATURE_VERCEL_BLOB_ENABLED: process.env.NEXT_PUBLIC_FEATURE_VERCEL_BLOB_ENABLED,
    NEXT_PUBLIC_FEATURE_VERCEL_INTEGRATION_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_VERCEL_INTEGRATION_ENABLED,
    NEXT_PUBLIC_FEATURE_STRIPE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED,

    // Analytics
    NEXT_PUBLIC_FEATURE_POSTHOG_ENABLED: process.env.NEXT_PUBLIC_FEATURE_POSTHOG_ENABLED,
    NEXT_PUBLIC_FEATURE_UMAMI_ENABLED: process.env.NEXT_PUBLIC_FEATURE_UMAMI_ENABLED,

    // DataFast Analytics
    NEXT_PUBLIC_FEATURE_DATAFAST_ENABLED: process.env.NEXT_PUBLIC_FEATURE_DATAFAST_ENABLED,
    NEXT_PUBLIC_DATAFAST_WEBSITE_ID: process.env.NEXT_PUBLIC_DATAFAST_WEBSITE_ID,
    NEXT_PUBLIC_DATAFAST_DOMAIN: process.env.NEXT_PUBLIC_DATAFAST_DOMAIN,

    // Google Analytics
    NEXT_PUBLIC_FEATURE_GOOGLE_ANALYTICS_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_GOOGLE_ANALYTICS_ENABLED,
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,

    // Google Tag Manager
    NEXT_PUBLIC_FEATURE_GOOGLE_TAG_MANAGER_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_GOOGLE_TAG_MANAGER_ENABLED,
    NEXT_PUBLIC_GOOGLE_GTM_ID: process.env.NEXT_PUBLIC_GOOGLE_GTM_ID,

    // Statsig
    NEXT_PUBLIC_FEATURE_STATSIG_ENABLED: process.env.NEXT_PUBLIC_FEATURE_STATSIG_ENABLED,
    NEXT_PUBLIC_STATSIG_CLIENT_KEY: process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY,

    // Consent Manager
    NEXT_PUBLIC_FEATURE_C15T_ENABLED: process.env.NEXT_PUBLIC_FEATURE_C15T_ENABLED,
    NEXT_PUBLIC_FEATURE_CONSENT_MANAGER_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_CONSENT_MANAGER_ENABLED,

    NEXT_PUBLIC_FEATURE_FILE_UPLOAD_ENABLED: process.env.NEXT_PUBLIC_FEATURE_FILE_UPLOAD_ENABLED,

    // Cloudflare Turnstile (CAPTCHA)
    NEXT_PUBLIC_FEATURE_TURNSTILE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_TURNSTILE_ENABLED,

    // Dev tools
    NEXT_PUBLIC_FEATURE_EVLOG_ENABLED: process.env.NEXT_PUBLIC_FEATURE_EVLOG_ENABLED,
    NEXT_PUBLIC_FEATURE_DEVTOOLS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_DEVTOOLS_ENABLED,
    NEXT_PUBLIC_FEATURE_DEVTOOLS_FONT_SELECTOR_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_DEVTOOLS_FONT_SELECTOR_ENABLED,
    NEXT_PUBLIC_FEATURE_DEVTOOLS_REACT_GRAB_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_DEVTOOLS_REACT_GRAB_ENABLED,
  },

  /**
   * Configuration options
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
