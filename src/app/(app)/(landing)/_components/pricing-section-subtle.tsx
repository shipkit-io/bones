"use client";
import { Link } from "@/components/primitives/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

// Define the features and pricing data
const pricingData: OfferCardProps[] = [
	{
		title: "Bones",
		description: "Perfect for indie developers and small projects",
		href: `https://${siteConfig.store.domain}/buy/${siteConfig.store.products.bones}`,
		price: 29,
		features: [
			"Next.js 15 App Router Setup",
			"Authentication (NextAuth v5)",
			"Basic UI Components",
			"TypeScript Configuration",
			"Basic Testing Setup",
			"Community Support",
		],
	},
	{
		title: "Muscles",
		description: "Production-ready, for teams that need advanced features",
		href: `https://${siteConfig.store.domain}/buy/${siteConfig.store.products.muscles}`,
		price: 99,
		features: [
			"Everything in Bones +",
			"Database Integration (Postgres)",
			"Email Service (Resend)",
			"Payment Processing",
			"CMS Integration",
			"Priority Support",
			"AI Workflows",
			"Advanced Components",
		],
		isBestValue: true,
	},
	{
		title: "Brains",
		description: "Enterprise-grade with custom features",
		href: `https://${siteConfig.store.domain}/buy/${siteConfig.store.products.brains}`,
		price: 349, // Custom pricing
		features: [
			"Everything in Muscles +",
			"Custom Integrations",
			"Advanced AI Tools",
			"Dedicated Support",
			"Architecture Review",
			"Custom Feature Development",
			"Team Training Session",
		],
	},
];

interface OfferCardProps {
	title: string;
	description: string;
	price: number | null;
	features: string[];
	isBestValue?: boolean;
	href: string;
}

export const PricingSectionSubtle: React.FC = () => {
	return (
		<div className="z-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{pricingData.map((offer) => (
				<OfferCard key={offer.title} {...offer} />
			))}
		</div>
	);
};

const OfferCard = ({
	title,
	description,
	price,
	features,
	isBestValue,
	href,
}: OfferCardProps) => {
	return (
		<div
			className={cn(
				"h-full transform-gpu rounded-2xl border bg-neutral-800/95 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-neutral-800/100 dark:bg-neutral-800/50",
				"text-white dark:text-neutral-400",
				isBestValue ? "border-[#ed8445]" : "border-neutral-500/50",
			)}
		>
			<div
				className={cn("p-6")}
				style={
					isBestValue
						? {
							background:
								"radial-gradient(58.99% 10.42% at 50% 100.46%, rgba(251, 188, 5, .07) 0, transparent 100%), radial-gradient(135.76% 66.69% at 92.19% -3.15%, rgba(251, 5, 153, .1) 0, transparent 100%), radial-gradient(127.39% 38.15% at 22.81% -2.29%, rgba(239, 145, 84, .4) 0, transparent 100%)",
						}
						: {}
				}
			>
				<div className="text-lg font-semibold text-neutral-200">{title}</div>
				<div className="mt-2 text-sm text-neutral-400">{description}</div>
				<div className="mt-4">
					<div className="text-4xl font-semibold text-neutral-200">
						{price ? `$${price}` : "Custom"}
					</div>
					<div className="text-sm text-neutral-400">
						{price ? "one-time payment" : "contact sales"}
					</div>
				</div>

				<Link
					href={href}
					className={cn(
						"my-12 inline-flex w-full transform-gpu items-center justify-center rounded-full border border-neutral-400/20 px-12 py-2.5 font-semibold tracking-tight text-neutral-50 transition-all hover:scale-105",
						isBestValue
							? "bg-gradient-to-br from-[#f6d4a1] to-[#ed8445]"
							: "bg-neutral-700",
					)}
					type="button"
				>
					{price ? "Get Started" : "Contact Sales"}
				</Link>
				<p className={cn("mb-4 text-sm font-semibold tracking-tight")}>
					What's included:
				</p>
				<ul className="space-y-2">
					{features.map((feature) => (
						<li className="flex items-center gap-2" key={feature}>
							<CheckIcon className="size-3.5 rounded-full stroke-neutral-300" />
							<div className="text-sm">{feature}</div>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};
