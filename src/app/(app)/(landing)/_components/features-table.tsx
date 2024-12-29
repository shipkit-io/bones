"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Check, HelpCircle, Minus } from "lucide-react";
import { Fragment, useState } from "react";

const comparisonData = [
	{
		category: "Core Features",
		features: [
			{
				name: "Next.js 15 App Router",
				description:
					"Latest Next.js features including server components, streaming, and more",
				bones: true,
				muscles: true,
				brains: true,
				badge: "Latest",
			},
			{
				name: "Authentication (NextAuth v5)",
				description:
					"Secure authentication with support for multiple providers and custom flows",
				bones: true,
				muscles: true,
				brains: true,
			},
			{
				name: "TypeScript Configuration",
				description:
					"Production-ready TypeScript setup with strict type checking and best practices",
				bones: true,
				muscles: true,
				brains: true,
			},
			{
				name: "Basic UI Components",
				description:
					"Pre-built, accessible components using Shadcn/UI and Radix",
				bones: true,
				muscles: true,
				brains: true,
			},
		],
	},
	{
		category: "Developer Experience",
		features: [
			{
				name: "VS Code Extensions",
				description: "Custom VS Code extensions for enhanced productivity",
				bones: true,
				muscles: true,
				brains: true,
				badge: "New",
			},
			{
				name: "CLI Tools",
				description: "Command-line tools for scaffolding and automation",
				bones: false,
				muscles: true,
				brains: true,
			},
			{
				name: "Type Safety",
				description: "End-to-end type safety with TypeScript and Zod",
				bones: true,
				muscles: true,
				brains: true,
				badge: "Popular",
			},
		],
	},
	{
		category: "Database & Backend",
		features: [
			{
				name: "PostgreSQL Integration",
				description: "Full database setup with Drizzle ORM and migrations",
				bones: false,
				muscles: true,
				brains: true,
			},
			{
				name: "Email Service (Resend)",
				description: "Transactional emails, templates, and audience management",
				bones: false,
				muscles: true,
				brains: true,
			},
			{
				name: "Payment Processing",
				description:
					"Lemon Squeezy integration with webhooks and subscription management",
				bones: false,
				muscles: true,
				brains: true,
			},
			{
				name: "CMS Integration",
				description: "Payload CMS setup with custom fields and API endpoints",
				bones: false,
				muscles: true,
				brains: true,
			},
		],
	},
	{
		category: "Advanced Features",
		features: [
			{
				name: "AI Workflows",
				description:
					"OpenAI integration with streaming responses and rate limiting",
				bones: false,
				muscles: true,
				brains: true,
			},
			{
				name: "Advanced Components",
				description:
					"Complex UI patterns, animations, and interactive elements",
				bones: false,
				muscles: true,
				brains: true,
			},
			{
				name: "Custom Integrations",
				description: "Tailored third-party service integrations for your needs",
				bones: false,
				muscles: false,
				brains: true,
			},
			{
				name: "Advanced AI Tools",
				description: "Custom AI models, fine-tuning, and specialized workflows",
				bones: false,
				muscles: false,
				brains: true,
			},
		],
	},
	{
		category: "Security & Performance",
		features: [
			{
				name: "Rate Limiting",
				description: "Built-in rate limiting for API routes and authentication",
				bones: false,
				muscles: true,
				brains: true,
			},
			{
				name: "Edge Functions",
				description: "Deploy functions to the edge for optimal performance",
				bones: false,
				muscles: true,
				brains: true,
				badge: "New",
			},
			{
				name: "Security Headers",
				description: "Pre-configured security headers and best practices",
				bones: true,
				muscles: true,
				brains: true,
			},
		],
	},
	{
		category: "Deployment & DevOps",
		features: [
			{
				name: "CI/CD Pipeline",
				description: "GitHub Actions workflow for automated deployments",
				bones: false,
				muscles: true,
				brains: true,
			},
			{
				name: "Docker Support",
				description: "Containerization setup with Docker and Compose",
				bones: false,
				muscles: true,
				brains: true,
			},
			{
				name: "Monitoring",
				description: "OpenTelemetry integration for observability",
				bones: false,
				muscles: false,
				brains: true,
				badge: "Pro",
			},
		],
	},
	{
		category: "Support",
		features: [
			{
				name: "Community Support",
				description: "Access to Discord community and GitHub discussions",
				bones: true,
				muscles: true,
				brains: true,
			},
			{
				name: "Priority Support",
				description: "24-hour response time and dedicated support channel",
				bones: false,
				muscles: true,
				brains: true,
			},
			{
				name: "Dedicated Support",
				description: "Direct access to the team with 4-hour response time",
				bones: false,
				muscles: false,
				brains: true,
			},
			{
				name: "Architecture Review",
				description: "In-depth review of your codebase and architecture",
				bones: false,
				muscles: false,
				brains: true,
			},
			{
				name: "Team Training Session",
				description: "Live training session for your team on best practices",
				bones: false,
				muscles: false,
				brains: true,
			},
		],
	},
];

interface FeatureNameProps {
	name: string;
	description: string;
	badge?: string;
}

const FeatureName = ({ name, description, badge }: FeatureNameProps) => (
	<div className="flex items-center gap-2">
		<div className="flex flex-col gap-1">
			<div className="flex items-center gap-2">
				<span>{name}</span>
				{badge && (
					<Badge
						variant={
							badge === "New"
								? "default"
								: badge === "Popular"
									? "secondary"
									: "outline"
						}
						className={cn(
							"h-5 text-xs",
							badge === "Pro" &&
							"bg-gradient-to-r from-indigo-500 to-purple-500",
						)}
					>
						{badge}
					</Badge>
				)}
			</div>
			<span className="text-xs text-muted-foreground md:hidden">
				{description}
			</span>
		</div>
		<Tooltip>
			<TooltipTrigger className="hidden md:inline-flex">
				<HelpCircle className="h-4 w-4 text-muted-foreground" />
			</TooltipTrigger>
			<TooltipContent>
				<p className="max-w-xs text-sm">{description}</p>
			</TooltipContent>
		</Tooltip>
	</div>
);

type PlanType = "bones" | "muscles" | "brains";
type CategoryType = (typeof comparisonData)[number]["category"];
type FilterType = "all" | "new" | "popular" | "pro" | "differences";
type HighlightType = "none" | "differences" | "new" | "popular" | "pro";

export const FeaturesTable = () => {
	const isMobile = useMediaQuery("(max-width: 768px)");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");
	const [filterType, setFilterType] = useState<FilterType>("all");
	const [highlightType, setHighlightType] = useState<HighlightType>("none");
	const [comparePlans, setComparePlans] = useState<PlanType[]>([
		"bones",
		"muscles",
		"brains",
	]);

	// Filter features based on search, category, and filter type
	const filteredData = comparisonData
		.filter(
			(category) =>
				selectedCategory === "all" || category.category === selectedCategory,
		)
		.map((category) => ({
			...category,
			features: category.features.filter((feature) => {
				const matchesSearch =
					feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					feature.description.toLowerCase().includes(searchQuery.toLowerCase());

				const matchesFilter = () => {
					switch (filterType) {
						case "new":
							return feature.badge === "New";
						case "popular":
							return feature.badge === "Popular";
						case "pro":
							return feature.badge === "Pro";
						case "differences":
							return !feature.bones || !feature.muscles || !feature.brains;
						default:
							return true;
					}
				};

				return matchesSearch && matchesFilter();
			}),
		}))
		.filter((category) => category.features.length > 0);

	const shouldHighlight = (
		feature: (typeof comparisonData)[0]["features"][0],
	) => {
		switch (highlightType) {
			case "differences":
				return !feature.bones || !feature.muscles || !feature.brains;
			case "new":
				return feature.badge === "New";
			case "popular":
				return feature.badge === "Popular";
			case "pro":
				return feature.badge === "Pro";
			default:
				return false;
		}
	};

	const togglePlanComparison = (plan: PlanType) => {
		setComparePlans((current) =>
			current.includes(plan)
				? current.filter((p) => p !== plan)
				: [...current, plan],
		);
	};

	return (
		<div className="w-full space-y-4">
			{/* Advanced Filter Controls */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
					<Input
						placeholder="Search features..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="max-w-sm"
					/>
					<Select
						value={selectedCategory}
						onValueChange={(value: CategoryType) => setSelectedCategory(value)}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							{comparisonData.map((category) => (
								<SelectItem key={category.category} value={category.category}>
									{category.category}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Feature Filters */}
				<Tabs
					value={filterType}
					onValueChange={(value) => {
						setFilterType(value as FilterType);
						setHighlightType(value as HighlightType);
					}}
				>
					<TabsList>
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value="differences">Differences</TabsTrigger>
						<TabsTrigger value="new">New</TabsTrigger>
						<TabsTrigger value="popular">Popular</TabsTrigger>
						<TabsTrigger value="pro">Pro</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Plan Selection (for desktop) */}
			{!isMobile && (
				<div className="flex items-center justify-end gap-2">
					{["bones", "muscles", "brains"].map((plan) => (
						<Button
							key={plan}
							variant={
								comparePlans.includes(plan as PlanType) ? "default" : "outline"
							}
							size="sm"
							onClick={() => togglePlanComparison(plan as PlanType)}
							className="capitalize"
						>
							{plan}
						</Button>
					))}
				</div>
			)}

			{/* Features Table */}
			<div className="rounded-lg border">
				<Table className="w-full">
					<TableHeader>
						<TableRow>
							<TableHead className="w-[300px]">Feature</TableHead>
							{!isMobile &&
								comparePlans.map((plan) => (
									<TableHead key={plan} className="text-center capitalize">
										{plan}
									</TableHead>
								))}
							{isMobile && (
								<TableHead className="text-center">Available</TableHead>
							)}
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredData.map((category) => (
							<Fragment key={category.category}>
								<TableRow>
									<TableCell
										colSpan={isMobile ? 2 : comparePlans.length + 1}
										className="bg-muted/50 font-semibold"
									>
										{category.category}
									</TableCell>
								</TableRow>
								{category.features.map((feature) => (
									<TableRow
										key={feature.name}
										className={cn(
											shouldHighlight(feature) &&
											"bg-primary/5 dark:bg-primary/10",
										)}
									>
										<TableCell>
											<FeatureName
												name={feature.name}
												description={feature.description}
												badge={feature.badge}
											/>
										</TableCell>
										{!isMobile ? (
											<>
												{comparePlans.map((plan) => (
													<TableCell key={plan} className="text-center">
														{feature[plan] ? (
															<Check
																className={cn(
																	"mx-auto h-4 w-4",
																	shouldHighlight(feature)
																		? "text-primary"
																		: "text-green-500",
																)}
															/>
														) : (
															<Minus className="mx-auto h-4 w-4 text-muted-foreground" />
														)}
													</TableCell>
												))}
											</>
										) : (
											<TableCell className="text-center">
												<Badge
													variant={
														feature.brains
															? "default"
															: feature.muscles
																? "secondary"
																: "outline"
													}
												>
													{feature.brains
														? "All Plans"
														: feature.muscles
															? "Muscles+"
															: "Bones+"}
												</Badge>
											</TableCell>
										)}
									</TableRow>
								))}
							</Fragment>
						))}
					</TableBody>
				</Table>
			</div>

			{/* No Results Message */}
			{filteredData.length === 0 && (
				<div className="py-8 text-center text-muted-foreground">
					No features found matching your criteria.
				</div>
			)}
		</div>
	);
};
