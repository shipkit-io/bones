"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Boundary } from "@/components/primitives/boundary";
import { Button, buttonVariants } from "@/components/ui/button";
import { STATUS_CODES } from "@/config/status-codes";
import { useSignInRedirectUrl } from "@/hooks/use-sign-in-redirect-url";
import { AuthenticationError } from "@/lib/errors/authentication-error";
import { logger } from "@/lib/logger";
import { redirectWithCode } from "@/lib/utils/redirect-with-code";

/**
 * Props Next.js passes to an `error.tsx` page.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/**
 * Route-level error page for the app. Re-exported as the default export of
 * `(app)/error.tsx`, so it must follow the Next.js error-page contract exactly:
 * the retry callback is named `reset`. (It was `resetAction` before, which
 * Next never passes, so "Try again" did nothing.)
 *
 * Visitors never see the raw error message: it can carry internals. They get
 * the digest Next attaches in production so support can find it in the logs.
 * The message shows only in development.
 */
export function ErrorBoundary({ error, reset }: ErrorPageProps) {
	const signInRedirectUrl = useSignInRedirectUrl();
	const isDevelopment = process.env.NODE_ENV === "development";

	useEffect(() => {
		if (error instanceof AuthenticationError) {
			logger.info("ErrorBoundary: Authentication error, redirecting to sign in");
			redirectWithCode(signInRedirectUrl, {
				code: STATUS_CODES.AUTH.code,
			});
			return;
		}
		logger.error("ErrorBoundary", error);
	}, [error, signInRedirectUrl]);

	return (
		<Boundary
			title="Something went wrong"
			description="The rest of the site is working. Try again, or head back to the homepage."
			className="min-h-[60vh] border-0 shadow-none"
		>
			<div className="flex flex-wrap items-center justify-center gap-sm">
				<Button type="button" onClick={reset}>
					Try again
				</Button>
				<Link href="/" className={buttonVariants({ variant: "outline" })}>
					Go to homepage
				</Link>
			</div>
			{error.digest && !isDevelopment && (
				<p className="text-xs text-muted-foreground">Reference {error.digest}</p>
			)}
			{isDevelopment && (
				<pre className="max-w-full overflow-auto rounded-md bg-muted p-sm text-left text-xs">
					{error.message}
				</pre>
			)}
		</Boundary>
	);
}
