import { eq } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { logger } from "@/lib/logger";
import { providers } from "@/server/auth-js/auth-providers.config";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { isAdmin } from "@/server/services/admin-service";
import { grantGitHubAccess } from "@/server/services/github/github-service";
import { userService } from "@/server/services/user-service";
import type { User } from "@/types/user";

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthConfig = {
  debug: process.env.DEBUG_AUTH === "true",
  providers,
  pages: {
    error: routes.auth.error,
    signIn: routes.auth.signIn,
    signOut: routes.auth.signOut,
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  // cookies: {
  // 	sessionToken: {
  // 		name:
  // 			process.env.NODE_ENV === "production"
  // 				? "__Secure-next-auth.session-token"
  // 				: "next-auth.session-token",
  // 		options: {
  // 			httpOnly: true,
  // 			sameSite: "lax",
  // 			path: "/",
  // 			secure: process.env.NODE_ENV === "production",
  // 		},
  // 	},
  // },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.id) return false;

      // Handle guest user sign-in
      if (account?.provider === "guest") {
        return true; // Always allow guest sign-in
      }

      // Account linking: allowDangerousEmailAccountLinking is enabled on all OAuth providers,
      // so multiple providers can be linked to the same email address automatically.

      // Handle GitHub OAuth connection
      if (account?.provider === "github" && account.access_token) {
        // Extract GitHub username from profile
        const githubProfile = profile as { login?: string } | undefined;
        let githubUsername = githubProfile?.login;

        logger.info("GitHub OAuth signIn callback", {
          profileUserId: user.id,
          userEmail: user.email,
          githubUsername,
        });

        // If profile doesn't have login, fetch it from GitHub API using the access token
        // This ensures we always have a username when we have an access token
        if (!githubUsername && account.access_token) {
          try {
            const response = await fetch("https://api.github.com/user", {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
                Accept: "application/vnd.github.v3+json",
              },
            });

            if (response.ok) {
              const apiProfile = (await response.json()) as { login?: string };
              githubUsername = apiProfile.login;
              logger.info(
                "Fetched GitHub username from API (missing from profile)",
                {
                  userEmail: user.email,
                  githubUsername,
                },
              );
            }
          } catch (fetchError) {
            logger.error("Failed to fetch GitHub username from API", {
              userEmail: user.email,
              error:
                fetchError instanceof Error
                  ? fetchError.message
                  : "Unknown error",
            });
          }
        }

        if (githubUsername && user.email) {
          try {
            // When linking accounts, user.id is the GitHub profile ID, not the database user ID
            // We need to find the existing user by email to update the correct record
            const existingUser = await db?.query.users.findFirst({
              where: eq(users.email, user.email),
              columns: { id: true },
            });

            const targetUserId = existingUser?.id || user.id;

            logger.info("Updating GitHub username for user", {
              targetUserId,
              existingUserId: existingUser?.id,
              profileUserId: user.id,
              githubUsername,
            });

            // Update the user record with the GitHub username
            await db
              ?.update(users)
              .set({
                githubUsername,
                updatedAt: new Date(),
              })
              .where(eq(users.id, targetUserId));

            logger.info("Stored GitHub username from OAuth profile", {
              userId: targetUserId,
              githubUsername,
            });

            // Grant repository access
            try {
              await grantGitHubAccess({ githubUsername });
              logger.info("Granted GitHub repository access", {
                userId: targetUserId,
                githubUsername,
              });
            } catch (grantError) {
              logger.error("Failed to grant GitHub repository access", {
                userId: targetUserId,
                githubUsername,
                error:
                  grantError instanceof Error
                    ? grantError.message
                    : "Unknown error",
              });
              // Don't fail sign-in if repo access fails
            }
          } catch (error) {
            logger.error("Failed to store GitHub username from OAuth", {
              userEmail: user.email,
              githubUsername,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            // Don't fail sign-in if this fails
          }
        } else {
          // Log warning if we have an access token but couldn't get a username
          // This creates a data inconsistency where getGitHubConnectionStatus() would show inconsistent state
          logger.warn(
            "GitHub OAuth connected but no username available - data inconsistency possible",
            {
              userEmail: user.email,
              hasAccessToken: !!account.access_token,
              profileLogin: githubProfile?.login,
            },
          );
        }

        return true;
      }

      // Special handling for credentials provider
      // This ensures the user exists in both databases and handles session creation properly
      if (account?.provider === "credentials") {
        // The user should already exist in both databases from validateCredentials
        // Just return true to allow sign in
        return true;
      }

      // For OAuth providers, use profile data to ensure user exists and is up to date
      // This handles cases where a user was created through OAuth but profile info changed
      if (account?.provider && profile) {
        try {
          await userService.ensureUserExists({
            id: user.id,
            email: user.email!,
            name: profile.name || user.name, // Use profile name if available
            image: profile.image || profile.picture || user.image, // Use profile image if available
          });
        } catch (error) {
          console.error(
            "Error ensuring user exists in Shipkit database:",
            error,
          );
          // Don't fail the sign-in if this fails, just log the error
        }
      } else {
        // Fallback for non-OAuth providers
        try {
          await userService.ensureUserExists({
            id: user.id,
            email: user.email!,
            name: user.name,
            image: user.image,
          });
        } catch (error) {
          console.error(
            "Error ensuring user exists in Shipkit database:",
            error,
          );
          // Don't fail the sign-in if this fails, just log the error
        }
      }

      // Log the sign in activity
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Handle the nextUrl parameter for redirects
      const redirectUrl = new URL(url, baseUrl);
      const nextUrl = redirectUrl.searchParams.get(SEARCH_PARAM_KEYS.nextUrl);

      if (nextUrl) {
        // Ensure it's a relative URL for security
        if (nextUrl.startsWith("/")) {
          return `${baseUrl}${nextUrl}`;
        }
      }

      // Default redirect
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user, account, trigger, session }) {
      // Save user data to the token
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;

        // Check admin status during login and cache in token
        token.isAdmin = await isAdmin({ email: user.email, userId: user.id });

        // Ensure avatar and other optional properties are persisted on JWT sessions
        const typedUser = user as User;
        if ("image" in typedUser) token.image = typedUser.image;
        if ("role" in typedUser) token.role = typedUser.role;
        // Store dates in JWT as ISO strings to avoid Date type mismatch after serialization
        if ("createdAt" in typedUser)
          token.createdAt = typedUser.createdAt
            ? new Date(typedUser.createdAt).toISOString()
            : undefined;
        if ("updatedAt" in typedUser)
          token.updatedAt = typedUser.updatedAt
            ? new Date(typedUser.updatedAt).toISOString()
            : undefined;

        // Mark as guest user if the account provider is guest
        if (account?.provider === "guest") {
          token.isGuest = true;
        }

        // Safely access optional properties
        if ("bio" in typedUser) token.bio = typedUser.bio;
        if ("githubUsername" in typedUser)
          token.githubUsername = typedUser.githubUsername;
        if ("theme" in typedUser) token.theme = typedUser.theme;
        if ("emailVerified" in typedUser)
          token.emailVerified = typedUser.emailVerified
            ? new Date(typedUser.emailVerified).toISOString()
            : null;
        if ("vercelConnectionAttemptedAt" in typedUser)
          token.vercelConnectionAttemptedAt =
            typedUser.vercelConnectionAttemptedAt
              ? new Date(typedUser.vercelConnectionAttemptedAt).toISOString()
              : null;

        // Store Payload CMS token if available (not for guest users)
        if (
          "payloadToken" in typedUser &&
          typeof typedUser.payloadToken === "string" &&
          !token.isGuest
        ) {
          token.payloadToken = typedUser.payloadToken;
        }
      }

      // Save GitHub access token when signing in with GitHub
      if (
        account?.provider === "github" &&
        account.access_token &&
        user?.email
      ) {
        token.githubAccessToken = account.access_token;

        // Fetch the updated user from database by email (user.id may be GitHub profile ID, not DB ID)
        // The signIn callback already stored the username, so we just need to retrieve it
        try {
          const updatedUser = await db?.query.users.findFirst({
            where: eq(users.email, user.email),
            columns: {
              id: true,
              githubUsername: true,
              metadata: true,
            },
          });

          if (updatedUser?.githubUsername) {
            token.githubUsername = updatedUser.githubUsername;
            logger.info("Retrieved GitHub username for JWT token", {
              dbUserId: updatedUser.id,
              githubUsername: updatedUser.githubUsername,
            });
          }

          // Update metadata with GitHub provider info (access token for API calls)
          if (updatedUser?.id) {
            const currentMetadata = updatedUser.metadata
              ? JSON.parse(updatedUser.metadata)
              : {};
            const newMetadata = {
              ...currentMetadata,
              providers: {
                ...currentMetadata.providers,
                github: {
                  id: account.providerAccountId,
                  accessToken: account.access_token,
                },
              },
            };

            await db
              ?.update(users)
              .set({
                metadata: JSON.stringify(newMetadata),
                updatedAt: new Date(),
              })
              .where(eq(users.id, updatedUser.id));
          }
        } catch (error) {
          logger.error("Error fetching updated user for JWT", {
            userEmail: user.email,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Handle direct GitHub username updates passed from session update
      // This is critical for UI updates when connecting or disconnecting GitHub
      if (session?.user?.githubUsername !== undefined) {
        token.githubUsername = session.user.githubUsername;
      }

      // Handle account updates directly from session
      if (session?.user?.accounts) {
        token.accounts = session.user.accounts;
      }

      // Handle Payload token updates in session
      if (session?.payloadToken && typeof session.payloadToken === "string") {
        token.payloadToken = session.payloadToken;
      }

      // Handle updates
      if (trigger === "update" && session) {
        if (session.theme) token.theme = session.theme;
        if (session.name) token.name = session.name;
        if (session.bio) token.bio = session.bio;
        if (session.payloadToken && typeof session.payloadToken === "string")
          token.payloadToken = session.payloadToken;
        if (session.vercelConnectionAttemptedAt)
          token.vercelConnectionAttemptedAt = new Date(
            session.vercelConnectionAttemptedAt,
          ).toISOString();
      }
      return token;
    },
    async session({ session, token, user }) {
      // Map from JWT token when present (JWT strategy)
      if (token?.id) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | null;
        session.user.email = token.email ?? "";
        // Normalize dates coming from JWT (which serializes Dates to ISO strings)
        session.user.emailVerified = token.emailVerified
          ? new Date(token.emailVerified as unknown as string | number | Date)
          : null;
        session.user.image =
          (token.image as string | null) ?? session.user.image ?? null;
        session.user.role = token.role as import("@/types/user").UserRole;
        session.user.theme = token.theme as
          | "light"
          | "dark"
          | "system"
          | undefined;
        session.user.bio = token.bio as string | null;
        session.user.githubUsername = token.githubUsername as string | null;
        session.user.vercelConnectionAttemptedAt =
          token.vercelConnectionAttemptedAt
            ? new Date(
                token.vercelConnectionAttemptedAt as unknown as
                  | string
                  | number
                  | Date,
              )
            : null;
        session.user.createdAt = token.createdAt
          ? new Date(token.createdAt as unknown as string | number | Date)
          : undefined;
        session.user.updatedAt = token.updatedAt
          ? new Date(token.updatedAt as unknown as string | number | Date)
          : undefined;
        session.user.metadata = token.metadata as string | null;
        session.user.isGuest = token.isGuest as boolean | undefined;
        session.user.isAdmin = token.isAdmin as boolean | undefined;
        session.user.accounts = token.accounts as {
          provider: string;
          providerAccountId: string;
        }[];
        if (
          token.payloadToken &&
          typeof token.payloadToken === "string" &&
          !token.isGuest
        ) {
          session.user.payloadToken = token.payloadToken;
        }
      }

      // When using database session strategy, populate from the database user
      if (!token?.id && user) {
        const typedUser = user as User;
        session.user.id = typedUser.id;
        session.user.name = typedUser.name;
        session.user.email = typedUser.email ?? "";
        session.user.emailVerified = typedUser.emailVerified ?? null;
        session.user.image = typedUser.image ?? null;
        session.user.role = typedUser.role ?? session.user.role;
        session.user.theme = typedUser.theme ?? session.user.theme;
        session.user.bio = typedUser.bio ?? session.user.bio;
        session.user.githubUsername =
          typedUser.githubUsername ?? session.user.githubUsername;
        session.user.createdAt = typedUser.createdAt ?? session.user.createdAt;
        session.user.updatedAt = typedUser.updatedAt ?? session.user.updatedAt;
        // Check admin status for database sessions
        session.user.isAdmin = await isAdmin({
          email: typedUser.email,
          userId: typedUser.id,
        });
        // Accounts will be fetched below
      }

      // If token didn't have accounts and we have a user from database, fetch accounts
      // Skip this for guest users as they don't have database entries
      if (!session.user.accounts && user && !session.user.isGuest) {
        // Fetch user accounts from database
        try {
          const accounts = await db?.query.accounts.findMany({
            where: (accounts, { eq }) => eq(accounts.userId, user.id),
            columns: {
              provider: true,
              providerAccountId: true,
            },
          });

          if (accounts) {
            session.user.accounts = accounts;
          }
        } catch (error) {
          console.error("Error fetching user accounts:", error);
        }
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
