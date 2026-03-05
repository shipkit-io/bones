"use client";
import { Link } from "@/components/primitives/link";
import type { PricingPlan } from "@/content/pricing/pricing-content";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface PricingSectionSubtleProps {
	plans?: PricingPlan[];
}

export const PricingSectionSubtle = ({ plans }: PricingSectionSubtleProps) => {
	return (
		<div className={cn("z-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2",
			`lg:grid-cols-${plans?.length}`
		)}>
			{plans?.map((plan) => (
				<OfferCard key={plan.title} {...plan} />
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
	isComingSoon,
}: PricingPlan) => {
	return (
		<div
			className={cn(
				"h-full transform-gpu rounded-2xl overflow-hidden border bg-neutral-800/95 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-neutral-800/100 dark:bg-neutral-800/50",
				"text-white dark:text-neutral-400",
				isBestValue ? "border-purple-500" : "border-neutral-500/50",
				isComingSoon ? "bg-neutral-700" : "",
			)}
		>
			<div
				className={cn("p-6")}
				style={
					isBestValue
						? {
							background:
								"radial-gradient(58.99% 10.42% at 50% 100.46%, rgba(147, 51, 234, 0.07) 0, transparent 100%), radial-gradient(135.76% 66.69% at 92.19% -3.15%, rgba(168, 85, 247, 0.1) 0, transparent 100%), radial-gradient(127.39% 38.15% at 22.81% -2.29%, rgba(139, 92, 246, 0.4) 0, transparent 100%)",
						}
						: {}
				}
			>
				<div className="text-lg font-semibold text-neutral-200">{title}</div>
				<div className="mt-2 text-sm text-neutral-400">{description}</div>
				<div className="mt-4">
					<div className="text-4xl font-semibold text-neutral-200">
						{price.oneTime ? `$${price.oneTime}` : "Free Forever"}
					</div>
					<div className="text-sm text-neutral-400">
						{price.oneTime ? "one-time payment" : "no credit card required"}
					</div>
				</div>

				{isComingSoon ? (
					<div className="my-12 inline-flex w-full transform-gpu items-center justify-center rounded-full border border-neutral-400/20 px-12 py-2.5 font-semibold tracking-tight text-neutral-50 transition-all hover:scale-105 bg-neutral-700">
						Coming Soon
					</div>
				) : (
					<Link
						href={href}
						className={cn(
							"my-12 inline-flex w-full transform-gpu items-center justify-center rounded-full border border-neutral-400/20 px-12 py-2.5 font-semibold tracking-tight text-neutral-50 transition-all hover:scale-105",
							isBestValue
								? "bg-gradient-to-br from-purple-400 to-purple-600"
								: "bg-neutral-700",
						)}
						type="button"
					>
						{price.oneTime ? "Get Started" : "Download Now"}
					</Link>
				)}
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
		</div >
	);
};
