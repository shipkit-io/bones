import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { routes } from "@/config/routes";
import { STATUS_CODES } from "@/config/status-codes";
import { AuthenticationError } from "@/lib/errors/authentication-error";
import { logger } from "@/lib/logger";
import { redirect } from "@/lib/utils/redirect";

/**
 * A hook that handles redirection after sign-in attempts, particularly for authentication errors
 *
 * @param error - Optional error object that triggered the redirect
 * @returns void
 *
 * @example
 * ```tsx
 * useRedirectAfterSignIn(error);
 * ```
 */

export const useRedirectAfterSignIn = (error?: Error) => {
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const redirectToSignIn = () => {
			redirect(routes.auth.signIn, {
				code: STATUS_CODES.AUTH.code,
				nextUrl: pathname ?? undefined,
			});
		};

		if (error instanceof AuthenticationError) {
			logger.info("ErrorBoundary: Authentication error, redirecting to sign in");
			redirectToSignIn();
		}
	}, [error, router, pathname]);
};
