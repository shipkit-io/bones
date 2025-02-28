"use client";

import { Boundary } from "@/components/primitives/boundary";
import { Button } from "@/components/ui/button";
import { STATUS_CODES } from "@/config/status-codes";
import { useSignInRedirectUrl } from "@/hooks/use-sign-in-redirect-url";
import { AuthenticationError } from "@/lib/errors/authentication-error";
import { logger } from "@/lib/logger";
import { redirectWithCode } from "@/lib/utils/redirect-with-code";
import { useEffect } from "react";

export default function ErrorBoundary({
	error,
	resetAction,
}: {
	error: Error & { digest?: string };
	resetAction: () => void;
}) {
	const signInRedirectUrl = useSignInRedirectUrl();

	useEffect(() => {
		// If the error is an authentication error, redirect to the sign in page
		if (error instanceof AuthenticationError) {
			logger.info("ErrorBoundary: Authentication error, redirecting to sign in");
			redirectWithCode(signInRedirectUrl, {
				code: STATUS_CODES.AUTH.code,
			});
		}

		// Optionally log the error to an error reporting service
		logger.error("ErrorBoundary", error);
	}, [error, signInRedirectUrl]);

	return (
		<Boundary title="Something went wrong." description={error.message}>
			<Button type="button" onClick={resetAction}>
				Try again
			</Button>
		</Boundary>
	);
}
