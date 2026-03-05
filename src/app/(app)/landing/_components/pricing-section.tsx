"use client";

import { Link } from "@/components/primitives/link";
import type { PricingPlan } from "@/content/pricing/pricing-content";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface PricingSectionProps {
	plans?: PricingPlan[];
	backgroundImage?: string;
}

export const PricingSection = ({
	plans,
	backgroundImage,
}: PricingSectionProps) => {
	return (
		<div className="relative">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{plans?.map((plan) => (
					<div key={plan.title} className="flex">
						<div
							className="relative flex w-full flex-col overflow-hidden rounded-3xl border border-neutral-800 p-6"
							style={backgroundImage ? {
								backgroundImage: `url(${backgroundImage})`,
								backgroundSize: 'cover',
								backgroundPosition: 'center',
								backgroundClip: 'padding-box',
							} : undefined}
						>
							{/* Overlay for better text readability */}
							<div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm rounded-3xl" />

							{/* Content */}
							<div className="relative z-10">
								<div className="mb-5 flex flex-col gap-3">
									<h3 className="text-xl font-bold">{plan.title}</h3>
									<p className="text-sm text-neutral-400">{plan.description}</p>
								</div>

								<div className="mb-5">
									<div className="text-3xl font-bold">
										{plan.price.oneTime ? `$${plan.price.oneTime}` : "Free"}
									</div>
									<div className="text-sm text-neutral-400">
										{plan.price.oneTime ? "one-time payment" : "no credit card required"}
									</div>
								</div>

								<div className="mb-5 flex flex-col gap-3">
									{plan.features.map((feature) => (
										<FeatureItem key={feature}>{feature}</FeatureItem>
									))}
								</div>

								<div className="mt-auto">
									<PricingButton
										href={plan.href}
										noCardRequired={!plan.price.oneTime}
									>
										{plan.price.oneTime ? "Get Started" : "Download"}
									</PricingButton>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

const FeatureItem = ({ children }: { children: string }) => {
	return (
		<div className="flex items-center gap-3">
			<div className="flex size-5 shrink-0 items-center justify-center rounded-full border border-neutral-800">
				<CheckIcon className="size-3" />
			</div>
			<span className="text-sm text-neutral-300">{children}</span>
		</div>
	);
};

const PricingButton = ({
	children,
	href,
	noCardRequired,
}: {
	children: string;
	href?: string;
	noCardRequired?: boolean;
}) => {
	return (
		<Link
			href={href || "#"}
			className={cn(
				"group flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-neutral-900",
				noCardRequired &&
				"border-emerald-900/50 bg-emerald-950/10 hover:bg-emerald-950/30",
			)}
		>
			{children}
		</Link>
	);
};
