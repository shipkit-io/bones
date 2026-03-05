import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { BASE_URL } from "@/config/base-url";
import { env } from "@/env";
import { db } from "@/server/db";
import { betterAuthSchema } from "./schema";

/**
 * Main Better Auth configuration
 * @see https://www.better-auth.com/docs/configuration
 *
 * This configuration is only used when Better Auth is enabled
 * via the BETTER_AUTH_ENABLED environment variable.
 */
export const auth = (() => {
	// Better Auth requires a database connection
	if (!db) {
		throw new Error(
			"Better Auth requires a database connection. Please set the DATABASE_URL environment variable."
		);
	}

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg", // PostgreSQL adapter
			schema: betterAuthSchema, // Use our custom schema
		}),

		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
		},

		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // 1 day
		},

		user: {
			additionalFields: {
				// Add custom fields to match existing Payload user structure
				firstName: {
					type: "string",
					required: false,
				},
				lastName: {
					type: "string",
					required: false,
				},
				avatar: {
					type: "string",
					required: false,
				},
				role: {
					type: "string",
					required: false,
					defaultValue: "user",
				},
			},
		},

		// Social providers configuration - uses standard OAuth env vars
		socialProviders: {
			// Google OAuth
			...(env.AUTH_GOOGLE_ID &&
				env.AUTH_GOOGLE_SECRET && {
					google: {
						clientId: env.AUTH_GOOGLE_ID,
						clientSecret: env.AUTH_GOOGLE_SECRET,
					},
				}),

			// GitHub OAuth
			...(env.AUTH_GITHUB_ID &&
				env.AUTH_GITHUB_SECRET && {
					github: {
						clientId: env.AUTH_GITHUB_ID,
						clientSecret: env.AUTH_GITHUB_SECRET,
					},
				}),

			// Discord OAuth
			...(env.AUTH_DISCORD_ID &&
				env.AUTH_DISCORD_SECRET && {
					discord: {
						clientId: env.AUTH_DISCORD_ID,
						clientSecret: env.AUTH_DISCORD_SECRET,
					},
				}),
		},

		secret: env?.BETTER_AUTH_SECRET || env?.AUTH_SECRET,
		baseURL: env?.BETTER_AUTH_BASE_URL || BASE_URL,

		trustedOrigins: [env?.BETTER_AUTH_BASE_URL || BASE_URL],

		callbacks: {
			async signUp({ user, account }: { user: any; account: any }) {
				// Custom logic after user signs up
				return { user, account };
			},

			async signIn({ user, account }: { user: any; account: any }) {
				// Custom logic after user signs in
				return { user, account };
			},
		},

		// Advanced options can be configured here if needed
		// See: https://www.better-auth.com/docs/reference/options
	});
})();

export type Auth = typeof auth;
