"use client";

import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import {
	Brain,
	Check,
	Code2,
	HelpCircle,
	Lock,
	type LucideIcon,
	Rocket,
	Search,
	Server,
	Settings,
	Shield,
	Sparkles,
	Users,
	X
} from "lucide-react";
import { Fragment, useState } from "react";

interface Feature {
	name: string;
	shipkit: boolean;
	others: boolean;
	tooltip?: string;
	icon?: LucideIcon;
	highlight?: boolean;
}

interface FeatureCategory {
	category: string;
	description: string;
	icon: LucideIcon;
	features: Feature[];
}

const features: FeatureCategory[] = [
	{
		category: "Core Features",
		description: "Essential components for any modern web app",
		icon: Rocket,
		features: [
			{
				name: "Authentication & User Management",
				shipkit: true,
				others: true,
				tooltip: "Multi-provider auth with role-based access control",
				icon: Users,
				highlight: true,
			},
			{
				name: "Database & ORM",
				shipkit: true,
				others: true,
				tooltip: "Type-safe PostgreSQL with automatic migrations",
				icon: Server,
			},
			{
				name: "Payment Processing",
				shipkit: true,
				others: true,
				tooltip: "Stripe integration with subscription management",
				icon: Lock,
			},
			{
				name: "Email System",
				shipkit: true,
				others: false,
				tooltip: "Transactional emails with analytics",
				icon: Settings,
			},
		],
	},
	{
		category: "AI Features",
		description: "Next-generation AI capabilities",
		icon: Brain,
		features: [
			{
				name: "Custom GPT Integration",
				shipkit: true,
				others: false,
				tooltip: "Pre-built GPT interfaces and cost optimization",
				icon: Sparkles,
				highlight: true,
			},
			{
				name: "AI Analytics Dashboard",
				shipkit: true,
				others: false,
				tooltip: "Track usage, costs, and performance",
				icon: Search,
			},
			{
				name: "Vector Database",
				shipkit: true,
				others: false,
				tooltip: "Built-in vector search capabilities",
				icon: Server,
			},
			{
				name: "Cost Optimization",
				shipkit: true,
				others: false,
				tooltip: "Automatic rate limiting and usage tracking",
				icon: Settings,
			},
		],
	},
	{
		category: "Developer Experience",
		description: "Tools to boost productivity",
		icon: Code2,
		features: [
			{
				name: "Type Safety",
				shipkit: true,
				others: false,
				tooltip: "End-to-end TypeScript with zero runtime errors",
				icon: Shield,
				highlight: true,
			},
			{
				name: "CI/CD Pipeline",
				shipkit: true,
				others: false,
				tooltip: "Production-ready deployment workflow",
				icon: Settings,
			},
			{
				name: "Development Tools",
				shipkit: true,
				others: false,
				tooltip: "ESLint, Prettier, Husky pre-configured",
				icon: Code2,
			},
			{
				name: "Hot Reload",
				shipkit: true,
				others: true,
				tooltip: "Instant feedback during development",
				icon: Rocket,
			},
		],
	},
	{
		category: "Enterprise Features",
		description: "Production-ready security and scalability",
		icon: Shield,
		features: [
			{
				name: "Role-Based Access",
				shipkit: true,
				others: false,
				tooltip: "Fine-grained permission system",
				icon: Lock,
				highlight: true,
			},
			{
				name: "Audit Logging",
				shipkit: true,
				others: false,
				tooltip: "Comprehensive activity tracking",
				icon: Search,
			},
			{
				name: "Security Features",
				shipkit: true,
				others: false,
				tooltip: "SOC2-ready security measures",
				icon: Shield,
			},
			{
				name: "Multi-Tenancy",
				shipkit: true,
				others: false,
				tooltip: "Built-in workspace isolation",
				icon: Users,
			},
		],
	},
];

export const ComparisonTable = () => {
	const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
	const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

	return (
		<div className="rounded-lg border max-w-[1200px] w-full mx-auto">
			<Table className="w-full">
				<TableHeader>
					<TableRow>
						<TableHead className="w-[40%]">Feature</TableHead>
						<TableHead className="text-center w-[30%]">
							<div className="flex flex-col items-center gap-1">
								<Badge variant="default">ShipKit</Badge>
								<span className="text-xs text-muted-foreground">
									Production-Ready
								</span>
							</div>
						</TableHead>
						<TableHead className="text-center w-[30%]">
							<div className="flex flex-col items-center gap-1 py-2">
								<Badge variant="secondary">Others</Badge>
								<span className="text-xs text-muted-foreground">
									Basic Features
								</span>
							</div>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{features.map((category) => (
						<Fragment key={category.category}>
							<TableRow
								className="cursor-pointer bg-muted/50 transition-colors hover:bg-muted/70"
								onClick={() =>
									setExpandedCategory(
										expandedCategory === category.category
											? null
											: category.category,
									)
								}
							>
								<TableCell colSpan={3}>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<category.icon className="h-5 w-5 text-primary" />
											<span className="font-medium">{category.category}</span>
										</div>
										<div className="text-sm text-muted-foreground">
											{category.description}
										</div>
									</div>
								</TableCell>
							</TableRow>
							{category.features.map((feature) => (
								<motion.tr
									key={feature.name}
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									onHoverStart={() => setHoveredFeature(feature.name)}
									onHoverEnd={() => setHoveredFeature(null)}
									className={[
										"relative",
										hoveredFeature === feature.name ? "bg-muted/30" : "",
										feature.highlight ? "bg-primary/5" : ""
									].filter(Boolean).join(" ")}
								>
									<TableCell className="font-medium">
										<div className="flex items-center gap-2">
											{feature.icon && (
												<feature.icon
													className={`h-4 w-4 ${hoveredFeature === feature.name ? "text-primary" : "text-muted-foreground"}`}
												/>
											)}
											<span
												className={feature.highlight ? "text-primary" : ""}
											>
												{feature.name}
											</span>
											{feature.tooltip && (
												<Tooltip>
													<TooltipTrigger>
														<HelpCircle className="h-4 w-4 text-muted-foreground" />
													</TooltipTrigger>
													<TooltipContent>{feature.tooltip}</TooltipContent>
												</Tooltip>
											)}
											{feature.highlight && (
												<Badge variant="default" className="text-[10px]">
													Popular
												</Badge>
											)}
										</div>
									</TableCell>
									<TableCell className="text-center">
										{feature.shipkit ? (
											<motion.div
												className="flex justify-center"
												whileHover={{ scale: 1.05 }}
											>
												<Badge
													variant="outline"
													className={`gap-1 transition-colors duration-200 ${hoveredFeature === feature.name
														? "bg-primary text-primary-foreground"
														: "bg-green-500/10 text-green-500"
														} `}
												>
													<Check className="h-3 w-3" />
													Included
												</Badge>
											</motion.div>
										) : (
											<X className="mx-auto h-4 w-4 text-muted-foreground" />
										)}
									</TableCell>
									<TableCell className="text-center">
										{feature.others ? (
											<motion.div
												whileHover={{ scale: 1.1 }}
												className="flex justify-center"
											>
												<Check className="h-4 w-4 text-green-500" />
											</motion.div>
										) : (
											<motion.div
												whileHover={{ scale: 1.1 }}
												className="flex justify-center"
											>
												<X className="h-4 w-4 text-muted-foreground" />
											</motion.div>
										)}
									</TableCell>
								</motion.tr>
							))}
						</Fragment>
					))}
				</TableBody>
			</Table>
		</div>
	);
};
