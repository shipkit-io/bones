"use client";

import { ErrorBoundary } from "@/components/primitives/error-boundary";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="bg-background">
				<ErrorBoundary
					fallback={({ error, retry }) => (
						<div className="h-screen w-screen flex items-center justify-center">
							<div className="text-center">
								<h1 className="text-2xl font-bold">Something went wrong.</h1>
								{process.env.NODE_ENV === "development" && (
									<div className="text-xs">
										<pre>{error.message}</pre>
									</div>
								)}
								<button onClick={retry}>Try again</button>
							</div>
						</div>
					)}
				>
					<div />
				</ErrorBoundary>
			</body>
		</html>
	);
}
