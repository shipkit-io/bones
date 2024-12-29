import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		DATABASE_URL: z.string().url().optional(),
		DB_PREFIX: z.string().default("db"),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		// Auth
		AUTH_SECRET: z.string().optional(),
		AUTH_URL: z.preprocess(
			(str) => process.env.VERCEL_URL ?? str,
			process.env.VERCEL ? z.string().optional() : z.string().url().optional(),
		),
		AUTH_DISCORD_ID: z.string().optional(),
		AUTH_DISCORD_SECRET: z.string().optional(),
		AUTH_GITHUB_ID: z.string().optional(),
		AUTH_GITHUB_SECRET: z.string().optional(),
		AUTH_GOOGLE_ID: z.string().optional(),
		AUTH_GOOGLE_SECRET: z.string().optional(),

		// GitHub (for downloading the repo)
		GITHUB_ACCESS_TOKEN: z.string().optional(),

		// Google
		GOOGLE_CLIENT_EMAIL: z.string().optional(),
		GOOGLE_PRIVATE_KEY: z.string().optional(),

		// OpenAI
		OPENAI_API_KEY: z.string().optional(),

		// Anthropic
		ANTHROPIC_API_KEY: z.string().optional(),

		// Lemon Squeezy
		LEMONSQUEEZY_API_KEY: z.string().optional(),
		LEMONSQUEEZY_STORE_ID: z.string().optional(),
		LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),

		// Resend
		RESEND_API_KEY: z.string().optional(),
		RESEND_AUDIENCE_ID: z.string().optional(),

		// Payload
		DISABLE_BUILDER: z.string().optional(),
		DISABLE_PAYLOAD: z.string().optional(),
		PAYLOAD_SECRET: z.string().optional(),

		// Upstash
		UPSTASH_REDIS_REST_URL: z.string().optional(),
		UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

		// Vercel
		VERCEL_ACCESS_TOKEN: z.string().optional(),
		VERCEL_CLIENT_ID: z.string().optional(),
		VERCEL_CLIENT_SECRET: z.string().optional(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_BUILDER_API_KEY: z.string().optional(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		DB_PREFIX: process.env.DB_PREFIX,
		NODE_ENV: process.env.NODE_ENV,
		AUTH_SECRET: process.env.AUTH_SECRET,
		AUTH_URL: process.env.AUTH_URL,
		AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
		AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
		AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
		AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
		AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
		AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
		GITHUB_ACCESS_TOKEN: process.env.GITHUB_ACCESS_TOKEN,
		GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
		GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
		NEXT_PUBLIC_BUILDER_API_KEY: process.env.NEXT_PUBLIC_BUILDER_API_KEY,
		LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
		LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
		LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
		DISABLE_BUILDER: process.env.DISABLE_BUILDER,
		DISABLE_PAYLOAD: process.env.DISABLE_PAYLOAD,
		PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
		UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
		UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
		VERCEL_ACCESS_TOKEN: process.env.VERCEL_ACCESS_TOKEN,
		VERCEL_CLIENT_ID: process.env.VERCEL_CLIENT_ID,
		VERCEL_CLIENT_SECRET: process.env.VERCEL_CLIENT_SECRET,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
