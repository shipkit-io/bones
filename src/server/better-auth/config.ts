import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { BASE_URL } from "@/config/base-url";
import { env } from "@/env";
import { resend } from "@/lib/resend";
import { db } from "@/server/db";
import { accounts, sessions, users, verificationTokens } from "@/server/db/schema";

/**
 * Better Auth mounts at this path. Auth.js owns `/api/auth`, so the two
 * handlers never collide and both can exist in the same deployment.
 */
export const BETTER_AUTH_BASE_PATH = "/api/better-auth";

/**
 * Better Auth reads and writes the app's own auth tables (`users`, `accounts`,
 * `sessions`, `verificationTokens`), the same ones Auth.js and every service
 * in the app use. Field names that differ are mapped below; columns Auth.js
 * never had were added to the schema as nullable extras.
 *
 * @see https://www.better-auth.com/docs/concepts/database
 */
const betterAuthTables = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verificationTokens,
};

const FROM_EMAIL = env.RESEND_FROM_EMAIL ?? "noreply@example.com";

/**
 * Email delivery goes through the existing Resend client. Without a
 * `RESEND_API_KEY` there is nothing to send with, so verification is not
 * required and reset emails are logged instead of sent.
 */
const canSendEmail = Boolean(resend);

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`Better Auth: RESEND_API_KEY is not set, skipping email "${subject}" to ${to}`);
    return;
  }
  await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
}

/**
 * Main Better Auth configuration
 * @see https://www.better-auth.com/docs/configuration
 *
 * Built only when Better Auth is enabled (`NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED`),
 * which requires `DATABASE_URL` plus `BETTER_AUTH_SECRET` or `APP_SECRET`.
 */
export const auth = (() => {
  // Better Auth requires a database connection
  if (!db) {
    throw new Error(
      "Better Auth requires a database connection. Please set the DATABASE_URL environment variable."
    );
  }

  return betterAuth({
    basePath: BETTER_AUTH_BASE_PATH,

    database: drizzleAdapter(db, {
      provider: "pg",
      schema: betterAuthTables,
    }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: canSendEmail,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail(
          user.email,
          "Reset your password",
          `<p>Someone asked to reset the password for this account.</p><p><a href="${url}">Choose a new password</a></p><p>If that was not you, ignore this email.</p>`
        );
      },
    },

    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(
          user.email,
          "Verify your email",
          `<p>Welcome! Confirm your email address to finish signing up.</p><p><a href="${url}">Verify email</a></p>`
        );
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      fields: {
        token: "sessionToken",
        expiresAt: "expires",
      },
    },

    user: {
      fields: {
        // Auth.js stores a timestamp in `emailVerified`; Better Auth wants a boolean.
        emailVerified: "emailVerifiedFlag",
      },
      additionalFields: {
        // The app's role column. `input: false` keeps sign-up bodies from setting it.
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false,
        },
        // Read-only view of the Auth.js verification timestamp so the session
        // facade can hand the app the `Date | null` it already expects.
        emailVerifiedAt: {
          type: "date",
          required: false,
          input: false,
          fieldName: "emailVerified",
        },
      },
    },

    account: {
      fields: {
        accountId: "providerAccountId",
        providerId: "provider",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
      },
      additionalFields: {
        // Auth.js requires `type` on every account row; filled in by the hook below.
        type: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },

    verification: {
      fields: {
        value: "token",
        expiresAt: "expires",
      },
    },

    databaseHooks: {
      user: {
        create: {
          before: (user) =>
            Promise.resolve({
              data: {
                ...user,
                // Auth.js defaults the timestamp to now; only stamp it when verified.
                emailVerifiedAt: user.emailVerified ? new Date() : null,
              },
            }),
        },
        update: {
          before: (user) => {
            if (!("emailVerified" in user)) return Promise.resolve();
            return Promise.resolve({
              data: { ...user, emailVerifiedAt: user.emailVerified ? new Date() : null },
            });
          },
        },
      },
      account: {
        create: {
          before: (account) =>
            Promise.resolve({
              data: {
                ...account,
                type: account.providerId === "credential" ? "credentials" : "oauth",
              },
            }),
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

    secret: env?.BETTER_AUTH_SECRET ?? env?.AUTH_SECRET,
    baseURL: env?.BETTER_AUTH_BASE_URL ?? BASE_URL,

    trustedOrigins: [env?.BETTER_AUTH_BASE_URL ?? BASE_URL],

    // Sets the session cookie from server actions and route handlers.
    // Must stay the last plugin.
    plugins: [nextCookies()],
  });
})();

export type Auth = typeof auth;
