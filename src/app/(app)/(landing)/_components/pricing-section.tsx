import { siteConfig } from "@/config/site";
import { CheckIcon } from "lucide-react";

const features = {
	bones: [
		"Next.js 15 App Router Setup",
		"Authentication (NextAuth v5)",
		"Basic UI Components",
		"TypeScript Configuration",
		"Basic Testing Setup",
		"Community Support",
	],
	muscles: [
		"Everything in Bones +",
		"Database Integration (Postgres)",
		"Email Service (Resend)",
		"Payment Processing",
		"CMS Integration",
		"Priority Support",
		"AI Workflows",
		"Advanced Components",
	],
	brains: [
		"Everything in Muscles +",
		"Custom Integrations",
		"Advanced AI Tools",
		"Dedicated Support",
		"Architecture Review",
		"Custom Feature Development",
		"Team Training Session",
	],
};

export const PricingSection: React.FC<{
	backgroundImage?: string;
}> = ({ backgroundImage = "/ui/pricing/advanced-gradient.jpg" }) => {
	return (
		<section className="py-24 text-neutral-800 dark:text-neutral-50 lg:pb-32">
			<div className="container mx-auto px-4">
				<div className="flex flex-wrap *:mx-auto">
					{/* Bones Plan */}
					<div className="w-full p-6 md:w-1/2 lg:w-1/3">
						<div className="h-full transform-gpu rounded-2xl border border-neutral-300 bg-white transition duration-500 hover:scale-105 dark:border-neutral-600 dark:bg-neutral-900">
							<div className="border-b border-neutral-300 p-12 dark:border-neutral-600">
								<div className="pr-9">
									<h4 className="mb-6 text-6xl tracking-tighter">Bones</h4>
									<p className="mb-2 text-xl font-semibold tracking-tight">
										$29
									</p>
									<p className="tracking-tight">
										Perfect for indie developers and small projects. Get started
										with core features.
									</p>
								</div>
							</div>
							<div className="p-12 pb-11">
								<ul className="-m-1.5 mb-11">
									{features.bones.map((feature) => (
										<FeatureItem key={feature}>{feature}</FeatureItem>
									))}
								</ul>
								<PricingButton
									href={`https://${siteConfig.store.domain}/buy/${siteConfig.store.products.bones}`}
									noCardRequired={true}
								>
									Get Started with Bones
								</PricingButton>
							</div>
						</div>
					</div>

					{/* Muscles Plan */}
					<div className="w-full p-6 md:w-1/2 lg:w-1/3">
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
											Muscles
										</h4>
										<p className="mb-2 text-xl font-semibold tracking-tighter text-white">
											$99
										</p>
										<p className="tracking-tight text-white">
											For teams that need advanced features and integrations.
											Most popular choice.
										</p>
									</div>
								</div>
								<div className="p-12 pb-11">
									<ul className="-m-1.5 mb-11">
										{features.muscles.map((feature) => (
											<FeatureItem key={feature}>{feature}</FeatureItem>
										))}
									</ul>
									<PricingButton
										href={`https://${siteConfig.store.domain}/buy/${siteConfig.store.products.muscles}`}
										noCardRequired={true}
									>
										Get Started with Muscles
									</PricingButton>
								</div>
							</div>
						</div>
					</div>

					{/* Brains Plan */}
					<div className="w-full p-6 md:w-1/2 lg:w-1/3">
						<div className="flex h-full transform-gpu flex-col justify-between rounded-2xl border border-neutral-300 bg-white transition duration-500 hover:scale-105 dark:border-neutral-600 dark:bg-neutral-900">
							<div className="border-neutral-300 p-12 dark:border-neutral-600">
								<div className="pr-9">
									<h4 className="mb-6 text-6xl tracking-tighter">Brains</h4>
									<p className="mb-2 text-xl font-semibold tracking-tighter">
										Custom Pricing
									</p>
									<p className="tracking-tight">
										Enterprise-grade solution with custom features and dedicated
										support.
									</p>
								</div>
							</div>
							<div className="p-12 pb-11">
								<ul className="-m-1.5 mb-11">
									{features.brains.map((feature) => (
										<FeatureItem key={feature}>{feature}</FeatureItem>
									))}
								</ul>
								<PricingButton
									href={`https://${siteConfig.store.domain}/buy/${siteConfig.store.products.brains}`}
									noCardRequired={true}
								>
									Get ShipKit Brains
								</PricingButton>
							</div>
						</div>
					</div>
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
