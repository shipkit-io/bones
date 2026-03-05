import { Check, Sparkles } from "lucide-react";
import type React from "react";
import { Link } from "@/components/primitives/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PricingPlan } from "@/content/pricing/pricing-content";
import { cn } from "@/lib/utils";

interface PricingSectionSingleProps {
	plans?: PricingPlan[];
	plan?: PricingPlan;
	children?: React.ReactNode;
}

export function PricingSectionSingle({ plans, plan, children }: PricingSectionSingleProps) {
	// Use the provided single plan, or the first plan from the plans array
	const selectedPlan = plan || (plans?.length ? plans[0] : null);

	if (!selectedPlan) {
		return null;
	}

	const price =
		selectedPlan.price.monthly || selectedPlan.price.annually || selectedPlan.price.oneTime || 0;
	const originalPrice = price * 2; // Example: showing original price as double

	return (
		<div className="relative w-full text-white">
			{/* Background gradient effect */}
			<div className="container mx-auto p-4">
				<Card className="relative mx-auto max-w-3xl overflow-hidden border-purple-500/50 backdrop-blur-sm">
					<div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
					<div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-purple-500/10 blur-[100px]" />

					<CardHeader className="relative space-y-4 p-8 text-center sm:p-12">
						<div className="flex items-center justify-center gap-2">
							<h2 className="text-3xl font-bold sm:text-4xl">{selectedPlan.title}</h2>
							{selectedPlan.isBestValue && <Sparkles className="h-6 w-6 text-purple-400" />}
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-center gap-3">
								<span className="text-2xl font-bold text-gray-400 line-through sm:text-3xl">
									${originalPrice}
								</span>
								<span className="text-4xl font-bold sm:text-5xl">${price}</span>
							</div>
							<div className="inline-block rounded-full bg-purple-500/10 px-4 py-1 text-purple-400">
								50% OFF - Until My Wedding
							</div>
							{selectedPlan.description && (
								<div className="border-gray-800 pt-8 text-center text-sm text-gray-400">
									<p>{selectedPlan.description}</p>
								</div>
							)}
						</div>
					</CardHeader>
					<CardContent className="relative space-y-8 p-8 sm:p-12">
						<Separator />

						<div className="grid gap-6 sm:grid-cols-2">
							{selectedPlan.features.map((feature) => (
								<div key={feature} className="flex items-center gap-2">
									<Check className="h-5 w-5 shrink-0 text-purple-400" />
									<span className="text-base">{feature}</span>
								</div>
							))}
						</div>

						<div className="pt-4">
							{selectedPlan.isComingSoon ? (
								<Button
									disabled
									className={cn("w-full bg-purple-500 text-lg text-white hover:bg-purple-600")}
								>
									Coming Soon
								</Button>
							) : (
								<Link
									href={selectedPlan.href}
									className={cn(
										buttonVariants({ variant: "default" }),
										"w-full bg-purple-500 text-lg text-white hover:bg-purple-600"
									)}
								>
									Get {selectedPlan.title} Now
								</Link>
							)}
						</div>
					</CardContent>
					{children && (
						<CardFooter className="relative flex flex-col gap-4">
							<Separator />
							{children}
						</CardFooter>
					)}
				</Card>
			</div>
		</div>
	);
}
