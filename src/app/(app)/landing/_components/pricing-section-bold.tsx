import type { PricingPlan } from "@/content/pricing/pricing-content";
import { CheckIcon } from "lucide-react";
import advancedGradient from "./advanced-gradient.jpg";

export interface PricingSectionBoldProps {
	plans: PricingPlan[];
	backgroundImage?: string;
}

export const PricingSectionBold = ({
	plans,
	backgroundImage = advancedGradient.src,
}: PricingSectionBoldProps) => {
	return (
		<section className="py-24 text-neutral-800 dark:text-neutral-50 lg:pb-32">
			<div className="container mx-auto px-4">
				<div className="flex flex-wrap *:mx-auto">
					{plans.map((plan, index) => {
						const isMiddlePlan = index === 1;
						const priceDisplay = plan.price.oneTime === 0 ? "Free" : `$${plan.price.oneTime}`;
						return (
							<div key={plan.title} className="w-full p-6 md:w-1/2 lg:w-1/3">
								{isMiddlePlan ? (
									<div
										className="transform-gpu overflow-hidden rounded-2xl p-px transition duration-500 hover:scale-105"
										style={{
											backgroundImage: `url(${backgroundImage})`,
											backgroundRepeat: "no-repeat",
											backgroundSize: "cover",
										}}
									>
										<div className="h-full rounded-2xl bg-white dark:bg-neutral-900">
											<div
												className="p-12"
												style={{
													backgroundImage: `url(${backgroundImage})`,
													backgroundRepeat: "no-repeat",
													backgroundSize: "cover",
												}}
											>
												<div className="pr-9">
													<h4 className="mb-6 text-6xl tracking-tighter text-white">
														{plan.title}
													</h4>
													<p className="mb-2 text-xl font-semibold tracking-tighter text-white">
														{priceDisplay}
													</p>
													<p className="tracking-tight text-white">
														{plan.description}
													</p>
												</div>
											</div>
											<div className="p-12 pb-11">
												<ul className="-m-1.5 mb-11">
													{plan.features.map((feature) => (
														<FeatureItem key={feature}>{feature}</FeatureItem>
													))}
												</ul>
												<PricingButton
													href={plan.href}
													noCardRequired={plan.noCardRequired}
												>
													{`Get Started with ${plan.title}`}
												</PricingButton>
											</div>
										</div>
									</div>
								) : (
									<div className="h-full transform-gpu rounded-2xl border border-neutral-300 bg-white transition duration-500 hover:scale-105 dark:border-neutral-600 dark:bg-neutral-900">
										<div className="border-b border-neutral-300 p-12 dark:border-neutral-600">
											<div className="pr-9">
												<h4 className="mb-6 text-6xl tracking-tighter">{plan.title}</h4>
												<p className="mb-2 text-xl font-semibold tracking-tight">
													{priceDisplay}
												</p>
												<p className="tracking-tight">{plan.description}</p>
											</div>
										</div>
										<div className="p-12 pb-11">
											<ul className="-m-1.5 mb-11">
												{plan.features.map((feature) => (
													<FeatureItem key={feature}>{feature}</FeatureItem>
												))}
											</ul>
											<PricingButton
												href={plan.href}
												noCardRequired={plan.noCardRequired}
											>
												{`Get Started with ${plan.title}`}
											</PricingButton>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};

const FeatureItem = ({ children }: { children: string }) => {
	return (
		<li className="flex items-center py-1.5">
			<CheckIcon className="mr-3 size-3" />
			<span className="font-medium tracking-tight">{children}</span>
		</li>
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
		<>
			<a
				className="inline-block w-full rounded-lg border border-neutral-700 bg-transparent px-5 py-4 text-center font-semibold tracking-tight transition duration-200 hover:scale-105 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-800"
				href={href ?? ""}
			>
				{children}
			</a>
			{noCardRequired && (
				<span className="text-sm tracking-tight text-neutral-600">
					No credit card required
				</span>
			)}
		</>
	);
};
