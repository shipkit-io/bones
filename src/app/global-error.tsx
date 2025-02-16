/* Global Error Boundary Component
 * This is a special Next.js component that catches and displays runtime errors
 * It must be a Client Component (hence the "use client" directive)
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
"use client";

import { Boundary } from "@/components/primitives/boundary";

/* GlobalError Component Props
 * @param {Error} error - The error object containing details about what went wrong
 * @param {string} error.digest - A unique hash of the error (useful for error tracking)
 * @param {() => void} resetAction - Function provided by Next.js to attempt recovery
 */
export default function GlobalError({
	error,
	resetAction,
}: {
	error: Error & { digest?: string };
	resetAction: () => void;
}) {
	/* Log error to console for development/debugging
	 * TODO: Replace with proper error tracking in production
	 */
	if (process.env.NODE_ENV === "development") {
		console.error(error);
	}

	return (
		/* Note: Must include html and body tags since this replaces the entire page */
		// ! We don't use the RootLayout here because there could be an error in it.
		<html lang="en" suppressHydrationWarning>
			<body className="bg-background">
				<Boundary title="Something went wrong!" actionText="Try again" onAction={resetAction} className="h-screen w-screen">
					{process.env.NODE_ENV === "development" && (
						<div className="text-xs">
							<pre>{error.message}</pre>
						</div>
					)}
				</Boundary>
			</body>
		</html>
	);
}
