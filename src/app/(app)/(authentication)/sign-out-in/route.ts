// This happens when the authentication token expires or there is an error refreshing.
// This will log the user out, then redirect to the sign in page

// This is a Route Handler, not a Next.js page, because signOut needs to be called by a server action or Route Handler
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { STATUS_CODES } from "@/config/status-codes";
import { logger } from "@/lib/logger";
import { routeRedirectWithCode } from "@/lib/utils/redirect-with-code";
import { signOut } from "@/server/auth";
import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
	[SEARCH_PARAM_KEYS.statusCode]: z
		.enum(
			Object.keys(STATUS_CODES) as [
				keyof typeof STATUS_CODES,
				...(keyof typeof STATUS_CODES)[],
			],
		)
		.optional(),
	[SEARCH_PARAM_KEYS.nextUrl]: z.string().optional(),
});

export const GET = async (request: NextRequest): Promise<NextResponse> => {
	const { searchParams } = new URL(request.url);

	const result = querySchema.safeParse({
		[SEARCH_PARAM_KEYS.statusCode]: searchParams.get(
			SEARCH_PARAM_KEYS.statusCode,
		),
		[SEARCH_PARAM_KEYS.nextUrl]: searchParams.get(SEARCH_PARAM_KEYS.nextUrl),
	});

	if (!result.success) {
		return routeRedirectWithCode(routes.auth.signIn, {
			code: STATUS_CODES.AUTH_REFRESH.code,
			request,
		});
	}

	const { code = STATUS_CODES.AUTH_REFRESH.code, nextUrl } = result.data;

	logger.info(`sign-out-in/route.ts - Signing out with code: ${code}`);
	await signOut({ redirect: false }).catch((error: Error) => {
		logger.error(`sign-out-in/route.ts - Sign out error: ${error.message}`);
	});

	return routeRedirectWithCode(nextUrl ?? routes.auth.signIn, {
		code,
		request,
	});
};
