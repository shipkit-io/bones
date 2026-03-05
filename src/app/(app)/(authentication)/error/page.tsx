import type { Metadata } from "next";
import { Suspense } from "react";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { AuthErrorContent } from "./_components/auth-error-content";

export const metadata: Metadata = constructMetadata({
	title: "Authentication Error",
	description: `An error occurred during authentication. Please try again or contact ${siteConfig.name} support.`,
	noIndex: true,
});

export default function AuthErrorPage() {
	return (
		<Suspense>
			<AuthErrorContent />
		</Suspense>
	);
}
