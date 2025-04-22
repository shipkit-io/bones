import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/*
 * Environment variable configuration using T3 Env
 * @see https://env.t3.gg
 */
export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		DATABASE_URL: z.string().url().optional(),
		DB_PREFIX: z.string().default("db"),
		NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

		// Auth
		AUTH_SECRET: z.string().optional(),
		AUTH_URL: z.preprocess(
			(str) => process.env.VERCEL_URL ?? str,
			process.env.VERCEL ? z.string().optional() : z.string().url().optional()
		),

		AUTH_DISCORD_ID: z.string().optional(),
		AUTH_DISCORD_SECRET: z.string().optional(),
		AUTH_GITHUB_ID: z.string().optional(),
		AUTH_GITHUB_SECRET: z.string().optional(),
		AUTH_GOOGLE_ID: z.string().optional(),
		AUTH_GOOGLE_SECRET: z.string().optional(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_BUILDER_API_KEY: z.string().optional(),
		NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
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

		NEXT_PUBLIC_BUILDER_API_KEY: process.env.NEXT_PUBLIC_BUILDER_API_KEY,
		NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
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
