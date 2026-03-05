import { PricingSectionSingle } from "@/components/blocks/pricing-section-single";
import { Link } from "@/components/primitives/link";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { singlePlan } from "@/content/pricing/pricing-content";
import type { Metadata } from "next";
import { FAQ } from "../_components/faq";
export const metadata: Metadata = constructMetadata({
	title: "Pricing & Plans - Start Building Today | Shipkit",
	description: "Transparent, flexible pricing for teams of all sizes. Launch your app with confidence using Shipkit's powerful features. Free tier available, no credit card required.",
	openGraph: {
		title: "Pricing & Plans - Start Building Today | Shipkit",
		description: "Transparent, flexible pricing for teams of all sizes. Launch your app with confidence using Shipkit's powerful features. Free tier available, no credit card required.",
		type: "website",
		siteName: "Shipkit",
		locale: "en_US",
	},
});

export default function PricingPage() {
	return (
		<div className="container mx-auto mt-header py-16">
			<div className="mx-auto max-w-3xl text-center">
				<h1 className="mb-4 text-4xl font-bold">Get Immediate Access</h1>
				<p className="mb-8 text-xl text-muted-foreground">
					Choose a plan and get immediate access to the app
				</p>
			</div>

			{/* Pricing Section */}
			<main className="flex-1">
				<div className="container mx-auto px-4">
					{/* <div className="py-24 lg:pb-32">
						<PricingSection plans={oneTimePlans} backgroundImage={advancedGradient.src} />
					</div>
					<div className="py-24 lg:pb-32">
						<PricingSectionSubscription plans={subscriptionPlans} />
					</div>
					<div className="py-24 lg:pb-32">
						<PricingSectionSubtle plans={oneTimePlans} />
					</div>
					<div className="py-24 lg:pb-32">
						<PricingSectionBold plans={oneTimePlans} />
					</div> */}
					<div className="py-24 lg:pb-32">
						<PricingSectionSingle plan={singlePlan} />
					</div>
				</div>
			</main>

			{/* FAQ Section */}
			<section className="mx-auto mt-24 max-w-3xl">
				<h2 className="mb-8 text-center text-2xl font-semibold">
					Common Questions
				</h2>
				<FAQ />
			</section>

			{/* Support Section */}
			<section className="mx-auto mt-24 max-w-2xl text-center">
				<h2 className="mb-4 text-2xl font-semibold">Need Help Deciding?</h2>
				<p className="text-muted-foreground">
					Our team is here to help you choose the right plan for your needs.{" "}
					<Link href={routes.contact}>Contact us</Link>
				</p>
			</section>
		</div>
	);
}
