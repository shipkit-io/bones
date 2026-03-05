import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Link } from "@/components/primitives/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";

export function PricingSectionSingle() {
	return (
		<div className="relative min-h-[500px] w-full text-white">
			{/* Background gradient effect */}
			<div className="container mx-auto px-4 py-24">
				<Card className="relative mx-auto max-w-3xl overflow-hidden border-purple-500/50 backdrop-blur-sm">
					<div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
					<div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-purple-500/10 blur-[100px]" />

					<CardHeader className="relative space-y-4 p-8 text-center sm:p-12">
						<div className="flex items-center justify-center gap-2">
							<h2 className="text-3xl font-bold sm:text-4xl">{siteConfig.title}</h2>
							<Sparkles className="h-6 w-6 text-purple-400" />
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-center gap-3">
								<span className="text-2xl font-bold text-gray-400 line-through sm:text-3xl">
									$250
								</span>
								<span className="text-4xl font-bold sm:text-5xl">$99</span>
							</div>
							<div className="inline-block rounded-full bg-purple-500/10 px-4 py-1 text-purple-400">
								Limited Time Offer - 60% OFF
							</div>
						</div>
					</CardHeader>

					<CardContent className="relative space-y-8 p-8 sm:p-12">
						<div className="grid gap-6 sm:grid-cols-2">
							{[
								"Complete CI/CD Solution",
								"Premium Features",
								"Priority Support",
								"Advanced Integrations",
								"Regular Updates",
								"Commercial License",
								"Team Collaboration",
								"Custom Workflows",
							].map((feature) => (
								<div key={feature} className="flex items-center gap-2">
									<Check className="h-5 w-5 shrink-0 text-purple-400" />
									<span className="text-base">{feature}</span>
								</div>
							))}
						</div>

						<div className="pt-4">
							<Link
								href={routes.external.buy}
								className={cn(
									buttonVariants({ variant: "default" }),
									"w-full bg-purple-500 text-lg text-white hover:bg-purple-600"
								)}
							>
								Get Shipkit Now
							</Link>
						</div>

						<div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
							<p>
								Want to see what Shipkit can do?{" "}
								<a
									href={routes.external.bones}
									className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300"
								>
									Start with Shipkit Bones
									<ArrowRight className="h-3 w-3" />
								</a>
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
