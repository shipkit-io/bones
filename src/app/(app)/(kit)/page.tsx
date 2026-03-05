import { Suspense } from "react";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { NextStepsSection } from "./_components/next-steps-section";
import { OnboardingHeader } from "./_components/onboarding-header";

export default function ShipkitOnboardingPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
			<Suspense fallback={<SuspenseFallback />}>
				<OnboardingHeader />
			</Suspense>

			<div className="container mx-auto px-4 py-8 space-y-12 max-w-screen-md">
				{/* <Suspense fallback={<SuspenseFallback />}>
					<FeatureGrid />
				</Suspense> */}
				<NextStepsSection />
			</div>
		</div>
	);
}
