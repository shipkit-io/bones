import type { Metadata } from "next";
import { Suspense } from "react";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { WaitlistFAQ } from "./_components/waitlist-faq";
import { WaitlistHero } from "./_components/waitlist-hero";
import { WaitlistSocialProof } from "./_components/waitlist-social-proof";

export const metadata: Metadata = constructMetadata({
	title: "Join the Waitlist",
	description: `Get early access to ${siteConfig.name}, the Next.js starter that saves weeks of setup time. Join developers who are tired of rebuilding auth, payments, and databases from scratch.`,
});

export default function WaitlistPage() {
	return (
		<div className="min-h-screen">
			<WaitlistHero />
			<Suspense fallback={<SuspenseFallback />}>
				<WaitlistSocialProof />
				<WaitlistFAQ />
			</Suspense>
		</div>
	);
}
