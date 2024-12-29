import { HeroSection } from "@/app/(app)/launch/_components/hero-section";
import { LaunchPageContent } from "@/app/(app)/launch/_components/launch-page-content";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { Suspense } from "react";

export default function LaunchPage() {
	return (
		<>
			<HeroSection />
			<Suspense fallback={<SuspenseFallback />}>
				<LaunchPageContent />
			</Suspense>
		</>
	);
}
