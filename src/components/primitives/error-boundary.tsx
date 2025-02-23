"use client";

import { Boundary } from "@/components/primitives/boundary";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { STATUS_CODES } from "@/config/status-codes";
import { AuthenticationError } from "@/lib/errors/authentication-error";
import { logger } from "@/lib/logger";
import { redirectWithCode } from "@/lib/utils/redirect-with-code";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ErrorBoundary({
	error,
	resetAction,
}: {
	error: Error & { digest?: string };
	resetAction: () => void;
}) {

	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		// If the error is an authentication error, redirect to the sign in page
		if (error instanceof AuthenticationError) {
			logger.info("ErrorBoundary: Authentication error, redirecting to sign in");
			redirectWithCode(routes.auth.signIn, {
				code: STATUS_CODES.AUTH.code,
				nextUrl: pathname,
			});
		}

		// Optionally log the error to an error reporting service
		logger.error("ErrorBoundary", error);
	}, [error, router, pathname]);

	return (
		<Boundary title="Something went wrong." description={error.message}>
			<Button type="button" onClick={resetAction}>
				Try again
			</Button>
		</Boundary>
	);
}
