import { env } from "@/env";

/**
 * Better Auth API route handler
 * @see https://www.better-auth.com/docs/installation/nextjs
 *
 * This handles all Better Auth endpoints:
 * - /api/better-auth/sign-in
 * - /api/better-auth/sign-up
 * - /api/better-auth/sign-out
 * - /api/better-auth/session
 * - /api/better-auth/callback/*
 * etc.
 *
 * Only active when Better Auth is properly configured with a database connection.
 */

// Feature gate: Only initialize Better Auth if properly configured
const isBetterAuthConfigured = env.NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED;

export async function GET(request: Request) {
	if (!isBetterAuthConfigured) {
		return new Response("Better Auth is not configured", { status: 404 });
	}

	const { auth } = await import("@/server/better-auth/config");
	return auth.handler(request);
}

export async function POST(request: Request) {
	if (!isBetterAuthConfigured) {
		return new Response("Better Auth is not configured", { status: 404 });
	}

	const { auth } = await import("@/server/better-auth/config");
	return auth.handler(request);
}
