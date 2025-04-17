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
		ENABLE_PAYLOAD: z.string().optional(), // Enable Payload CMS

		// ======== Database ========
		DATABASE_URL: z.string().url().optional(),
		DB_PREFIX: z.string().default("db"),

		// ======== Authentication ========
		AUTH_SECRET: z.string().optional(),
		AUTH_URL: z.preprocess(
			(str) => process.env.VERCEL_URL ?? str,
			process.env.VERCEL ? z.string().optional() : z.string().url().optional()
		),
		// ======== Credentials (requires DB) ========
		AUTH_CREDENTIALS_ENABLED: z.string().optional(),

		// Email and Magic login
		AUTH_RESEND_KEY: z.string().optional(),
		RESEND_AUDIENCE_ID: z.string().optional(),
		RESEND_FROM: z.string().optional(),

		// OAuth Providers
		AUTH_DISCORD_ID: z.string().optional(),
		AUTH_DISCORD_SECRET: z.string().optional(),
		AUTH_GITHUB_ID: z.string().optional(),
		AUTH_GITHUB_SECRET: z.string().optional(),
		AUTH_GOOGLE_ID: z.string().optional(),
		AUTH_GOOGLE_SECRET: z.string().optional(),

		// ======== Content Management ========
		// Payload CMS
		PAYLOAD_SECRET: z.string().optional(),

		// ======== External Services ========
		// GitHub
		GITHUB_ACCESS_TOKEN: z.string().optional(),
		GITHUB_REPO_OWNER: z.string().optional(),
		GITHUB_REPO_NAME: z.string().optional(),

		// Google
		GOOGLE_CLIENT_EMAIL: z.string().optional(),
		GOOGLE_PRIVATE_KEY: z.string().optional(),

		// AI Services
		OPENAI_API_KEY: z.string().optional(),
		ANTHROPIC_API_KEY: z.string().optional(),

		// Payments
		LEMONSQUEEZY_API_KEY: z.string().optional(),
		LEMONSQUEEZY_STORE_ID: z.string().optional(),
		LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),

		// Polar
		POLAR_ACCESS_TOKEN: z.string().optional(),
		POLAR_PLATFORM_URL: z.string().optional(),

		// Storage
		AWS_REGION: z.string().optional(),
		AWS_ACCESS_KEY_ID: z.string().optional(),
		AWS_SECRET_ACCESS_KEY: z.string().optional(),
		AWS_BUCKET_NAME: z.string().optional(),

		// Caching
		UPSTASH_REDIS_REST_URL: z.string().optional(),
		UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

		// Deployment
		VERCEL_ACCESS_TOKEN: z.string().optional(),
		VERCEL_CLIENT_ID: z.string().optional(),
		VERCEL_CLIENT_SECRET: z.string().optional(),
	},

	/**
	 * Client-side environment variables schema
	 * These variables are exposed to the client and must be prefixed with NEXT_PUBLIC_
	 */
	client: {
		// Content Management
		NEXT_PUBLIC_BUILDER_API_KEY: z.string().optional(),

		// Analytics
		NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
		NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
		NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),

		// Polar Products
		NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID: z.string().optional(),
		NEXT_PUBLIC_POLAR_ONE_TIME_PRICE_ID: z.string().optional(),

		// ======== Build-Time Feature Flags (Derived in next.config.ts) ========
		NEXT_PUBLIC_FEATURE_DATABASE_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_BUILDER_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_MDX_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_AUTH_VERCEL_ENABLED: zBooleanFeatureFlag,
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

		// Analytics
		NEXT_PUBLIC_FEATURE_POSTHOG_ENABLED: zBooleanFeatureFlag,
		NEXT_PUBLIC_FEATURE_UMAMI_ENABLED: zBooleanFeatureFlag,

		// File Upload
		NEXT_PUBLIC_FEATURE_FILE_UPLOAD_ENABLED: zBooleanFeatureFlag,
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

		// Database
		DATABASE_URL: process.env.DATABASE_URL,
		DB_PREFIX: process.env.DB_PREFIX,

		// Authentication
		AUTH_SECRET: process.env.AUTH_SECRET,
		AUTH_URL: process.env.AUTH_URL,
		AUTH_CREDENTIALS_ENABLED: process.env.AUTH_CREDENTIALS_ENABLED,
		AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY,
		RESEND_FROM: process.env.RESEND_FROM,
		RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
		// OAuth Providers
		AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
		AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
		AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
		AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
		AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
		AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,

		// Content Management
		PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,

		// External Services (Server-side keys)
		GITHUB_ACCESS_TOKEN: process.env.GITHUB_ACCESS_TOKEN,
		GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
		GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
		GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
		GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
		LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
		LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
		LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
		POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
		POLAR_PLATFORM_URL: process.env.POLAR_PLATFORM_URL,
		AWS_REGION: process.env.AWS_REGION,
		AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
		AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
		UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
		UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
		VERCEL_ACCESS_TOKEN: process.env.VERCEL_ACCESS_TOKEN,
		VERCEL_CLIENT_ID: process.env.VERCEL_CLIENT_ID,
		VERCEL_CLIENT_SECRET: process.env.VERCEL_CLIENT_SECRET,

		// Client-side variables (Original)
		NEXT_PUBLIC_BUILDER_API_KEY: process.env.NEXT_PUBLIC_BUILDER_API_KEY,
		NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
		NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
		NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
		NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID: process.env.NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID,
		NEXT_PUBLIC_POLAR_ONE_TIME_PRICE_ID: process.env.NEXT_PUBLIC_POLAR_ONE_TIME_PRICE_ID,

		// Build-Time Feature Flags (Client-side)
		NEXT_PUBLIC_FEATURE_DATABASE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_DATABASE_ENABLED,
		NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED: process.env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED,
		NEXT_PUBLIC_FEATURE_BUILDER_ENABLED: process.env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED,
		NEXT_PUBLIC_FEATURE_MDX_ENABLED: process.env.NEXT_PUBLIC_FEATURE_MDX_ENABLED,
		NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED,
		NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED:
			process.env.NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED,
		NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED:
			process.env.NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED,
		NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED,
		NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED,
		NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED,
		NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED,
		NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED,
		NEXT_PUBLIC_FEATURE_AUTH_VERCEL_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AUTH_VERCEL_ENABLED,
		NEXT_PUBLIC_FEATURE_GITHUB_API_ENABLED: process.env.NEXT_PUBLIC_FEATURE_GITHUB_API_ENABLED,
		NEXT_PUBLIC_FEATURE_GOOGLE_SERVICE_ACCOUNT_ENABLED:
			process.env.NEXT_PUBLIC_FEATURE_GOOGLE_SERVICE_ACCOUNT_ENABLED,
		NEXT_PUBLIC_FEATURE_OPENAI_ENABLED: process.env.NEXT_PUBLIC_FEATURE_OPENAI_ENABLED,
		NEXT_PUBLIC_FEATURE_ANTHROPIC_ENABLED: process.env.NEXT_PUBLIC_FEATURE_ANTHROPIC_ENABLED,
		NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED: process.env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED,
		NEXT_PUBLIC_FEATURE_POLAR_ENABLED: process.env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED,
		NEXT_PUBLIC_FEATURE_S3_ENABLED: process.env.NEXT_PUBLIC_FEATURE_S3_ENABLED,
		NEXT_PUBLIC_FEATURE_REDIS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_REDIS_ENABLED,
		NEXT_PUBLIC_FEATURE_POSTHOG_ENABLED: process.env.NEXT_PUBLIC_FEATURE_POSTHOG_ENABLED,
		NEXT_PUBLIC_FEATURE_UMAMI_ENABLED: process.env.NEXT_PUBLIC_FEATURE_UMAMI_ENABLED,
		NEXT_PUBLIC_FEATURE_VERCEL_API_ENABLED: process.env.NEXT_PUBLIC_FEATURE_VERCEL_API_ENABLED,
		NEXT_PUBLIC_FEATURE_VERCEL_BLOB_ENABLED: process.env.NEXT_PUBLIC_FEATURE_VERCEL_BLOB_ENABLED,

		NEXT_PUBLIC_FEATURE_FILE_UPLOAD_ENABLED: process.env.NEXT_PUBLIC_FEATURE_FILE_UPLOAD_ENABLED,
	},

	/**
	 * Configuration options
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
