"use client";

import { Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FAQSection } from "./_components/faq-section";

const plans = [
	{
		title: "Hobby",
		price: "Free",
		description: "Perfect for side projects and learning",
		features: [
			"Up to 3 projects",
			"Basic components",
			"Community support",
			"Dark mode",
			"Basic analytics",
		],
	},
	{
		title: "Pro",
		price: "$19",
		description: "Everything you need for professional development",
		features: [
			"Unlimited projects",
			"Advanced components",
			"Priority support",
			"Custom themes",
			"Advanced analytics",
			"API access",
			"Team collaboration",
		],
		highlighted: true,
	},
	{
		title: "Enterprise",
		price: "$49",
		description: "For large teams and organizations",
		features: [
			"Everything in Pro",
			"Custom branding",
			"Dedicated support",
			"SLA guarantee",
			"Advanced security",
			"Custom integrations",
			"Training sessions",
		],
	},
];

interface PriceCardProps {
	title: string;
	price: string;
	description: string;
	features: string[];
	highlighted?: boolean;
	ctaText?: string;
}

function PriceCard({
	title,
	price,
	description,
	features,
	highlighted = false,
	ctaText = "Get Started",
}: PriceCardProps) {
	return (
		<Card className={`relative p-6 ${highlighted ? "border-primary shadow-lg" : ""}`}>
			{highlighted && (
				<span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">
					Most Popular
				</span>
			)}
			<div className="mb-4">
				<h3 className="text-xl font-semibold">{title}</h3>
				<div className="mt-2">
					<span className="text-3xl font-bold">{price}</span>
					{price !== "Free" && <span className="text-muted-foreground">/month</span>}
				</div>
				<p className="mt-2 text-muted-foreground">{description}</p>
			</div>
			<ul className="mb-6 space-y-3">
				{features.map((feature) => (
					<li key={uuidv4()} className="flex items-center gap-2">
						<Check className="h-4 w-4 text-primary" />
						<span className="text-sm">{feature}</span>
					</li>
				))}
			</ul>
			<Button className="w-full" variant={highlighted ? "default" : "outline"}>
				{ctaText}
			</Button>
		</Card>
	);
}

export default function PricingPage() {
	return (
		<div className="min-h-screen bg-background">
			<section className="py-20">
				<div className="container mx-auto px-4">
					{/* Header */}
					<div className="mb-16 text-center">
						<Badge variant="secondary" className="mb-4">
							Pricing
						</Badge>
						<h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
							Simple, transparent pricing
						</h1>
						<p className="mx-auto max-w-2xl text-xl text-muted-foreground">
							Choose the perfect plan for your needs. All plans include updates and core features.
						</p>
					</div>

					{/* Pricing Cards */}
					<div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
						{plans.map((plan, index) => (
							<PriceCard key={uuidv4()} {...plan} />
						))}
					</div>

					{/* FAQ Section */}
					<FAQSection />
				</div>
			</section>
		</div>
	);
}
