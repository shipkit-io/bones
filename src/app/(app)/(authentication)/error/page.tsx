import { Suspense } from "react";
import { AuthErrorContent } from "./_components/auth-error-content";

/**
 * The content reads `?error=` with useSearchParams, which bails static
 * prerendering unless it sits inside a Suspense boundary. The root
 * loading.tsx used to provide that boundary implicitly (and caused soft 404s
 * site-wide); this page owns its own now.
 */
export default function AuthErrorPage() {
	return (
		<Suspense fallback={null}>
			<AuthErrorContent />
		</Suspense>
	);
}
