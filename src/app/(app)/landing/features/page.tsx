import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FAQ } from "../_components/faq";
import { FeaturesTable } from "../_components/features-table";



export const metadata: Metadata = constructMetadata({
	title: `${siteConfig.title} Features & Capabilities`,
	description: "Explore Shipkit's powerful features: Next.js 14, TypeScript, Payload CMS, Auth.js, Builder.io, and more. Everything you need to build modern, scalable applications.",
	openGraph: {
		title: `${siteConfig.title} Features & Capabilities`,
		description: "Explore Shipkit's powerful features: Next.js 14, TypeScript, Payload CMS, Auth.js, Builder.io, and more. Everything you need to build modern, scalable applications.",
		type: "website",
		siteName: siteConfig.title,
		locale: "en_US",
	},
	keywords: [
		"Next.js",
		"TypeScript",
		"Payload CMS",
		"Auth.js",
		"Builder.io",
		"App Development",
		"Web Development",
		"Full Stack Framework",
		"Developer Tools",
		"Application Builder"
	],
});

export default async function Features() {
	return (
		<div className="container mx-auto mt-header space-y-section py-16">
			<div className="mx-auto max-w-3xl text-center">
				<h1 className="mb-4 text-4xl font-bold">Choose Your Plan</h1>
				<p className="mb-8 text-xl text-muted-foreground">
					Compare our plans and find the perfect fit for your project
				</p>
			</div>

			{/* Feature Comparison Table */}
			<section className="mx-auto">
				<h2 className="mb-8 text-center text-2xl font-semibold">
					Feature Comparison
				</h2>

				<div className="mx-auto max-w-screen-lg">
					<FeaturesTable />
				</div>
			</section>

			{/* FAQ Section */}
			<section className="mx-auto max-w-3xl">
				<h2 className="mb-8 text-center text-2xl font-semibold">
					Frequently Asked Questions
				</h2>
				<Suspense fallback={<SuspenseFallback />}>
					<FAQ />
				</Suspense>
			</section>
		</div>
	);
}
