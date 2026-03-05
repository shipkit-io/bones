// This will log the user out, then redirect to the sign in page

// This happens when the authentication token expires or there is an error refreshing.

import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// This is a Route Handler, not a Next.js page, because signOut needs to be called by a server action or Route Handler
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { STATUS_CODES } from "@/config/status-codes";
import { logger } from "@/lib/logger";
import { routeRedirect } from "@/lib/utils/redirect";
import { signOut } from "@/server/auth";

const querySchema = z.object({
	[SEARCH_PARAM_KEYS.statusCode]: z
		.enum(
			Object.keys(STATUS_CODES) as [keyof typeof STATUS_CODES, ...(keyof typeof STATUS_CODES)[]]
		)
		.optional(),
	[SEARCH_PARAM_KEYS.nextUrl]: z.string().optional(),
});

export const GET = async (request: NextRequest): Promise<NextResponse> => {
	const { searchParams } = new URL(request.url);

	// Parse any parameters from the URL
	const result = querySchema.safeParse({
		[SEARCH_PARAM_KEYS.statusCode]: searchParams.get(SEARCH_PARAM_KEYS.statusCode),
		[SEARCH_PARAM_KEYS.nextUrl]: searchParams.get(SEARCH_PARAM_KEYS.nextUrl),
	});

	await signOut({ redirect: false }).catch((error: Error) => {
		logger.error(`sign-out/route.ts - Sign out error: ${error.message}`);
	});

	// If the parameters are not valid, redirect to the sign in page
	if (!result.success) {
		return routeRedirect(routes.auth.signIn, {
			code: STATUS_CODES.AUTH_REFRESH.code,
			request,
		});
	}

	const { code = STATUS_CODES.AUTH_REFRESH.code, nextUrl } = result.data;

	logger.info(`sign-out/route.ts - Signing out with code: ${code}`);

	return routeRedirect(nextUrl ?? routes.auth.signIn, {
		code,
		request,
	});
};
