import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { Adapter, AdapterAccount } from "@auth/core/adapters";
import { eq } from "drizzle-orm";
import type { Session } from "next-auth";
import NextAuth from "next-auth";
import { cache } from "react";
import { buildTimeFeatures } from "@/config/features-config";
import { routes } from "@/config/routes";
import { STATUS_CODES } from "@/config/status-codes";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { redirect, routeRedirect } from "@/lib/utils/redirect";
import { authOptions } from "@/server/auth-js/auth.config";
import { isGuestOnlyMode } from "@/server/auth-js/auth-providers-utils";
import { db } from "@/server/db";
import { accounts, sessions, users, verificationTokens } from "@/server/db/schema";
import { grantGitHubAccess } from "@/server/services/github/github-service";
import type { UserRole } from "@/types/user";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */

/**
 * Using database session strategy with credentials provider requires special handling:
 * 1. The credentials provider must create a user in the database
 * 2. The user must be properly linked between Payload CMS and Shipkit
 * 3. The session must be created in the database
 *
 * This is handled in:
 * - auth.providers.ts: The credentials provider's authorize function
 * - auth-service.ts: The validateCredentials and ensureUserSynchronized methods
 * - auth.config.ts: The signIn callback
 *
 * For guest users:
 * - JWT strategy is used since guest users don't persist in the database
 * - No adapter is used when in guest-only mode
 */
// Determine if we should use database adapter
const shouldUseDatabaseAdapter = env.NEXT_PUBLIC_FEATURE_DATABASE_ENABLED && db && !isGuestOnlyMode;

const {
	auth: nextAuthAuth,
	handlers,
	signIn,
	signOut,
	unstable_update: update,
} = buildTimeFeatures.AUTH_ENABLED
	? NextAuth({
			...authOptions,
			secret: env.AUTH_SECRET ?? "supersecretshipkit",
			// Override session strategy based on adapter usage
			session: {
				...authOptions.session,
				strategy: shouldUseDatabaseAdapter ? "database" : "jwt",
			},
			// Use database adapter only when not in guest-only mode and database is available
			adapter: shouldUseDatabaseAdapter
				? DrizzleAdapter(db as any, {
						usersTable: users,
						accountsTable: accounts,
						sessionsTable: sessions,
						verificationTokensTable: verificationTokens,
					})
				: undefined,
			logger: {
				error: (code: Error, ...message: unknown[]) => {
					logger.error(code, message);
				},
				warn: (code: string, ...message: unknown[]) => {
					logger.warn(code, message);
				},
				debug: (code: string, ...message: unknown[]) => {
					logger.debug(code, message);
				},
			},
		})
	: {
			auth: () => Promise.resolve(null),
			handlers: {
				GET: async (request: Request) => {
					const url = new URL(request.url);
					const path = url.pathname;
					if (path.includes("/auth/session")) {
						// Gracefully indicate no active session when auth is disabled
						return Response.json(null, { status: 200 });
					}
					return Response.json(
						{
							ok: false,
							error: "AUTH_DISABLED",
							message:
								"Authentication is not configured. Add database and/or auth provider environment variables to enable sign-in.",
							docs: "https://errors.authjs.dev#autherror",
						},
						{ status: 503 }
					);
				},
				POST: async () =>
					Response.json(
						{
							ok: false,
							error: "AUTH_DISABLED",
							message:
								"Authentication is not configured. Add database and/or auth provider environment variables to enable sign-in.",
							docs: "https://errors.authjs.dev#autherror",
						},
						{ status: 503 }
					),
			},
			signIn: () => Promise.resolve(),
			signOut: () => Promise.resolve(),
			unstable_update: () => Promise.resolve({} as any),
		};
interface AuthProps {
	errorCode?: string;
	nextUrl?: string;
	protect?: boolean;
	redirect?: boolean;
	redirectTo?: string;
	role?: UserRole;
}
type ProtectedSession = Session & { user: NonNullable<Session["user"]> };

// Overloads and implementation for authWithOptions
function authWithOptions(props: { protect: true } & AuthProps): Promise<ProtectedSession>;
function authWithOptions(props?: AuthProps): Promise<Session | null>;
async function authWithOptions(props?: AuthProps) {
	const session = await nextAuthAuth();
	const { errorCode, redirect: shouldRedirect, nextUrl } = props ?? {};

	// Route protected
	// Use clear boolean logic without nullish coalescing on non-nullish expressions
	const protect =
		(props?.protect ?? false) || props?.redirectTo !== undefined || (shouldRedirect ?? false);
	const redirectTo = props?.redirectTo ?? routes.auth.signIn;

	const handleRedirect = (code: string) => {
		logger.warn(`[authWithOptions] Redirecting to ${redirectTo} with code ${code}`);

		// Determine if we're in a route handler context
		const isFromRouteHandler = typeof Response !== "undefined" && typeof window === "undefined";

		if (isFromRouteHandler) {
			return routeRedirect(redirectTo, {
				code,
				nextUrl,
			});
		}

		return redirect(redirectTo, {
			code,
			nextUrl,
		});
	};

	// TODO: Handle refresh token error
	// if (session?.error === "RefreshTokenError") {
	//   return handleRedirect(STATUS_CODES.AUTH_REFRESH.code);
	// }

	if (protect && !session?.user?.id) {
		return handleRedirect(errorCode ?? STATUS_CODES.AUTH.code);
	}

	// TODO: RBAC
	// if (role && session?.user?.role !== role) {
	//   return handleRedirect(errorCode ?? STATUS_CODES.AUTH_ROLE.code); // TODO: We shouldn't sign them out
	// }

	return session;
}

const cachedAuth = cache(authWithOptions);

export {
	// authWithOptions as auth,
	cachedAuth as auth,
	handlers,
	signIn,
	signOut,
	update,
};

// export {
//     invalidateSessionToken,
//     validateToken,
//     isSecureContext,
// } from "./auth.config";
