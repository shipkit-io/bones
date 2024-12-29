"use client";

import { Boundary } from "@/components/primitives/boundary";

export default function GlobalError({
	error,
	resetAction,
}: {
	error: Error & { digest?: string };
	resetAction: () => void;
}) {
	// TODO: remove
	console.error(error);
	return (
		<html>
			<body>
				<Boundary
					title="Something went wrong!"
					actionText="Try again"
					onAction={resetAction}
				>
					<div className="text-xs">
						<pre>{error.message}</pre>
					</div>
				</Boundary>
			</body>
		</html>
	);
}
