"use client";
import {
	BarChart3,
	Brain,
	Check,
	Copy,
	CreditCard,
	Database,
	ExternalLink,
	FileText,
	type LucideIcon,
	Mail,
	Settings,
	Shield,
	X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { env } from "@/env";

interface FeatureConfig {
	name: string;
	description: string;
	icon: LucideIcon;
	category: "core" | "auth" | "cms" | "payments" | "ai" | "analytics" | "integrations";
	envVar: string;
	isEnabled: boolean;
	setupGuide: string;
	dependencies?: string[];
}

const features: FeatureConfig[] = [
	{
		name: "Database",
		description: "PostgreSQL with Drizzle ORM for type-safe database operations",
		icon: Database,
		category: "core",
		envVar: "NEXT_PUBLIC_FEATURE_DATABASE_ENABLED",
		isEnabled: !!env.NEXT_PUBLIC_FEATURE_DATABASE_ENABLED,
		setupGuide: "/docs/database",
		dependencies: ["DATABASE_URL"],
	},
	{
		name: "Authentication",
		description: "Multi-provider authentication",
		icon: Shield,
		category: "auth",
		envVar: "NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED",
		isEnabled: !!env.NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED,
		setupGuide: "/docs/auth",
		dependencies: ["AUTH_SECRET", "AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"],
	},
	{
		name: "Payload CMS",
		description: "Headless CMS for content management with admin interface",
		icon: FileText,
		category: "cms",
		envVar: "NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED",
		isEnabled: !!env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED,
		setupGuide: "/docs/cms/payload",
		dependencies: ["PAYLOAD_SECRET", "DATABASE_URL"],
	},
	{
		name: "Builder.io",
		description: "Visual page builder with drag-and-drop interface",
		icon: Settings,
		category: "cms",
		envVar: "NEXT_PUBLIC_FEATURE_BUILDER_ENABLED",
		isEnabled: !!env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED,
		setupGuide: "/docs/cms/builder",
		dependencies: ["NEXT_PUBLIC_BUILDER_API_KEY"],
	},
	{
		name: "Payment Processing",
		description: "LemonSqueezy integration for payments and subscriptions",
		icon: CreditCard,
		category: "payments",
		envVar: "NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED",
		isEnabled: !!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED,
		setupGuide: "/docs/payments",
		dependencies: [
			"LEMONSQUEEZY_API_KEY",
			"LEMONSQUEEZY_STORE_ID",
			"STRIPE_SECRET_KEY",
			"POLAR_SECRET_KEY",
		],
	},
	{
		name: "AI Integration",
		description: "OpenAI and Anthropic integrations for AI-powered features",
		icon: Brain,
		category: "ai",
		envVar: "NEXT_PUBLIC_FEATURE_OPENAI_ENABLED",
		isEnabled: !!env.NEXT_PUBLIC_FEATURE_OPENAI_ENABLED,
		setupGuide: "/docs/ai",
		dependencies: ["OPENAI_API_KEY"],
	},
	{
		name: "Email Service",
		description: "Resend integration for transactional emails",
		icon: Mail,
		category: "integrations",
		envVar: "NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED",
		isEnabled: !!env.NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED,
		setupGuide: "/docs/email",
		dependencies: ["RESEND_API_KEY"],
	},
	{
		name: "Analytics",
		description: "PostHog integration for user analytics and tracking",
		icon: BarChart3,
		category: "analytics",
		envVar: "NEXT_PUBLIC_FEATURE_POSTHOG_ENABLED",
		isEnabled: !!env.NEXT_PUBLIC_FEATURE_POSTHOG_ENABLED,
		setupGuide: "/docs/analytics",
		dependencies: ["NEXT_PUBLIC_POSTHOG_KEY"],
	},
];

const categoryColors = {
	core: "bg-blue-500/10 text-blue-700 border-blue-200",
	auth: "bg-green-500/10 text-green-700 border-green-200",
	cms: "bg-purple-500/10 text-purple-700 border-purple-200",
	payments: "bg-orange-500/10 text-orange-700 border-orange-200",
	ai: "bg-pink-500/10 text-pink-700 border-pink-200",
	analytics: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
	integrations: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
};

export function FeatureGrid() {
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-3xl font-bold tracking-tight">Available Features</h2>
				<p className="mt-2 text-lg text-muted-foreground">
					Enable features by setting environment variables. Click the copy button to get the exact
					variable name.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{features.map((feature) => {
					const Icon = feature.icon;
					return (
						<Card key={feature.name} className="relative transition-all hover:shadow-lg">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<Icon />
									<div className="flex items-center gap-2">
										<Badge variant="outline" className={categoryColors[feature.category]}>
											{feature.category}
										</Badge>
										{feature.isEnabled ? (
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger>
														<Check className="h-4 w-4 text-green-500" />
													</TooltipTrigger>
													<TooltipContent>
														<p>Feature is enabled</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										) : (
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger>
														<X className="h-4 w-4 text-gray-400" />
													</TooltipTrigger>
													<TooltipContent>
														<p>Feature is disabled</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										)}
									</div>
								</div>
								<CardTitle className="text-lg">{feature.name}</CardTitle>
								<CardDescription>{feature.description}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{feature.dependencies && feature.dependencies.length > 0 && (
									<>
										<div className="space-y-2">
											<span className="text-sm font-medium">Required Variables:</span>
											{feature.dependencies.map((dep) => (
												<div key={dep} className="flex items-center justify-between">
													<code className="text-xs bg-muted px-2 py-1 rounded">{dep}</code>
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => copyToClipboard(dep)}
																	className="h-6 px-2"
																>
																	<Copy className="h-3 w-3" />
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																<p>Copy variable name</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</div>
											))}
										</div>
									</>
								)}

								<Separator />
								<Button variant="outline" size="sm" className="w-full" asChild>
									<a href={feature.setupGuide} className="flex items-center gap-2">
										<ExternalLink className="h-3 w-3" />
										Setup Guide
									</a>
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
