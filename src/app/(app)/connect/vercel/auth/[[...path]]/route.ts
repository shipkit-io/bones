import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";
import { env } from "@/env";
import { STATUS_CODES } from "@/config/status-codes";
import { routes } from "@/config/routes";
import { routeRedirect } from "@/lib/utils/redirect";

interface RouteContext {
	params: Promise<{
		path?: string[];
	}>;
}

export async function GET(request: NextRequest, context: RouteContext) {
	console.log("[Vercel OAuth] Callback hit", { url: request.url });

	if (!env.NEXT_PUBLIC_FEATURE_VERCEL_INTEGRATION_ENABLED) {
		console.log("[Vercel OAuth] Feature flag disabled, redirecting to /");
		return NextResponse.redirect(new URL("/", request.url));
	}

	try {
		const session = await auth();
		console.log("[Vercel OAuth] Session check", { hasUser: !!session?.user, userId: session?.user?.id });

		if (!session?.user) {
			return NextResponse.redirect(new URL(routes.auth.signIn, request.url));
		}

		// Await the params Promise
		const resolvedParams = await context.params;
		// Determine the base path for redirection from the dynamic route parameter
		const pathSegments = resolvedParams.path;
		let redirectBasePath = routes.settings.account; // Default

		if (pathSegments && pathSegments.length > 0) {
			const decodedPath = pathSegments.map(decodeURIComponent).join("/");
			// Ensure the path starts with a slash
			redirectBasePath = decodedPath.startsWith("/") ? decodedPath : `/${decodedPath}`;
		}

		// Helper function to construct redirect URLs
		const constructRedirectUrl = (params: Record<string, string>) => {
			const url = new URL(redirectBasePath, request.url);
			for (const [key, value] of Object.entries(params)) {
				url.searchParams.set(key, value);
			}
			return url;
		};

		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");
		const configurationId = searchParams.get("configurationId");
		const teamId = searchParams.get("teamId");

		// Log all parameters for debugging
		console.log("Vercel OAuth callback parameters:", {
			code: code ? "present" : "missing",
			state,
			error,
			configurationId,
			teamId,
			allParams: Object.fromEntries(searchParams.entries()),
		});

		if (error) {
			console.error("Error in Vercel OAuth callback:", error);
			// Use dynamic redirect path for error
			return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
		}

		// CRITICAL: Validate CSRF token
		// Since sessionStorage is client-side only, we need to pass the state through cookies
		// Get the stored state from cookie instead
		const cookieStore = request.cookies;
		const storedState = cookieStore.get("vercel_oauth_state")?.value;

		if (!state || !storedState || state !== storedState) {
			console.error("CSRF validation failed: state mismatch");
			return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
		}

		if (!code) {
			console.error("No code provided in Vercel OAuth callback");
			// Use dynamic redirect path for error
			return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
		}

		// Get the origin for the redirect_uri - this should be the fixed callback route
		const origin = new URL(request.url).origin;
		// Construct the specific redirect_uri for Vercel API, which might not include the dynamic path
		const vercelCallbackUri = `${origin}/connect/vercel/auth`;

		// Exchange code for access token
		const tokenResponse = await fetch("https://api.vercel.com/v2/oauth/access_token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				code,
				client_id: process.env.VERCEL_CLIENT_ID!,
				client_secret: process.env.VERCEL_CLIENT_SECRET!,
				redirect_uri: vercelCallbackUri, // Use the fixed callback URI for the API call
			}),
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			console.error("Failed to exchange code for token:", errorText);
			// Use dynamic redirect path for error
			return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
		}

		const tokenData = await tokenResponse.json();
		console.log("Token exchange successful:", tokenData);

		const { access_token, refresh_token, expires_in, team_id } = tokenData;

		// Get user info from Vercel
		const userResponse = await fetch("https://api.vercel.com/v2/user", {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		});

		if (!userResponse.ok) {
			console.error("Failed to get user info from Vercel");
			// Use dynamic redirect path for error
			return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
		}

		const userData = await userResponse.json();
		console.log("User info retrieved:", {
			hasUserId: !!(userData.user?.id || userData.user?.uid),
			user: userData.user
				? {
					id: userData.user.id || userData.user.uid,
					email: userData.user.email,
					username: userData.user.username,
					name: userData.user.name,
				}
				: null,
		});

		const vercelUserId = userData.user?.id || userData.user?.uid;

		if (!vercelUserId) {
			console.error("Failed to get Vercel user ID");
			// Use dynamic redirect path for error
			return NextResponse.redirect(constructRedirectUrl({ code: "VERCEL_CONNECTION_FAILED" }));
		}

		// Calculate token expiry date - default to 30 days if expires_in is not provided
		let expiresAt = null;
		if (expires_in) {
			expiresAt = new Date();
			expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
			expiresAt = Math.floor(expiresAt.getTime() / 1000); // Convert to Unix timestamp
		} else {
			// Default to 30 days if expires_in is not provided
			expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
		}

		// Store the access token and user info in the database
		try {
			if (!db) {
				console.error("Database not initialized - cannot save Vercel connection");
				return routeRedirect(routes.settings.account, {
					code: STATUS_CODES.CONNECT_VERCEL_ERROR.code,
					nextUrl: request.url,
					request: request,
				});
			}

			// First, check if this Vercel account (by providerAccountId) already exists
			const existingAccount = await db
				.select()
				.from(accounts)
				.where(and(eq(accounts.provider, "vercel"), eq(accounts.providerAccountId, vercelUserId)))
				.limit(1);

			if (existingAccount && existingAccount.length > 0) {
				// If exists, update instead of insert
				await db
					.update(accounts)
					.set({
						userId: session.user.id, // Update to current user if account exists but belongs to another user
						access_token,
						refresh_token,
						expires_at: expiresAt,
						token_type: "bearer",
						scope: "user team",
					})
					.where(
						and(eq(accounts.provider, "vercel"), eq(accounts.providerAccountId, vercelUserId))
					);

				console.log("Updated existing Vercel account for user:", session.user.id);
			} else {
				// Delete any existing Vercel connections for this user (different providerAccountId)
				await db
					.delete(accounts)
					.where(and(eq(accounts.provider, "vercel"), eq(accounts.userId, session.user.id)));

				// Insert new account
				await db.insert(accounts).values({
					userId: session.user.id,
					type: "oauth",
					provider: "vercel",
					providerAccountId: vercelUserId,
					access_token,
					refresh_token,
					expires_at: expiresAt,
					token_type: "bearer",
					scope: "user team",
					id_token: null,
					session_state: null,
				});

				console.log("Inserted new Vercel account for user:", session.user.id);
			}
		} catch (dbError) {
			console.error("Database error handling Vercel account:", dbError);
			throw dbError;
		}

		console.log("Account data stored in database for user:", session.user.id);

		// Try to update the session directly - this won't always work in a server route
		// but can help in some cases by signaling the auth system that accounts have changed
		try {
			const { update } = await import("@/server/auth");
			await update({
				user: {
					accounts: [{ provider: "vercel", providerAccountId: vercelUserId }],
				},
			});
			console.log("Auth session updated with Vercel account");
		} catch (error) {
			console.warn("Could not update session directly:", error);
			// This is non-fatal, the UI will handle updating via updateSession
		}

		// Redirect back using the dynamic path with success message and clear CSRF cookie
		const successResponse = NextResponse.redirect(
			constructRedirectUrl({ code: STATUS_CODES.CONNECT_VERCEL.code })
		);
		successResponse.cookies.delete("vercel_oauth_state");
		return successResponse;
	} catch (error) {
		console.error("Error in Vercel OAuth callback:", error);
		// Await the params Promise in catch block as well
		const resolvedParams = await context.params;
		// Determine the base path for redirection even in the catch block
		const pathSegments = resolvedParams.path;
		let redirectBasePath = routes.settings.account; // Default
		if (pathSegments && pathSegments.length > 0) {
			const decodedPath = pathSegments.map(decodeURIComponent).join("/");
			redirectBasePath = decodedPath.startsWith("/") ? decodedPath : `/${decodedPath}`;
		}
		const errorUrl = new URL(redirectBasePath, request.url);
		errorUrl.searchParams.set("code", "VERCEL_ERROR");
		return NextResponse.redirect(errorUrl);
	}
}
