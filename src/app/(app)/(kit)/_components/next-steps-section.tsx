import {
	ArrowRight,
	CheckCircle,
	Circle,
	CreditCard,
	Database,
	FileText,
	type LucideIcon,
	Rocket,
	Shield,
	Zap,
} from "lucide-react";
import { Link } from "@/components/primitives/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { env } from "@/env";

interface NextStep {
	title: string;
	description: string;
	icon: LucideIcon;
	href: string;
	isComplete: boolean;
	isOptional?: boolean;
	estimatedTime: string;
}

const nextSteps: NextStep[] = [
	{
		title: "Set up your database",
		description: "Configure PostgreSQL and run your first migration",
		icon: Database,
		href: `${routes.docs}/database`,
		isComplete: !!env?.NEXT_PUBLIC_FEATURE_DATABASE_ENABLED,
		estimatedTime: "5 min",
		isOptional: true,
	},
	{
		title: "Configure authentication",
		description: "Set up authentication providers",
		icon: Shield,
		href: `${routes.docs}/auth`,
		isComplete: !!env.NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED,
		estimatedTime: "10 min",
		isOptional: true,
	},
	{
		title: "Choose your CMS",
		description: "Set up Payload CMS or Builder.io for content management",
		icon: FileText,
		href: `${routes.docs}/cms`,
		isComplete:
			!!env?.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED || !!env?.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED,
		isOptional: true,
		estimatedTime: "15 min",
	},
	{
		title: "Enable payments",
		description: "Configure Stripe, Polar, or LemonSqueezy for subscriptions and one-time payments",
		icon: CreditCard,
		href: `${routes.docs}/payments`,
		isComplete:
			!!env?.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED ||
			!!env?.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED ||
			!!env?.NEXT_PUBLIC_FEATURE_POLAR_ENABLED,
		isOptional: true,
		estimatedTime: "20 min",
	},
];

const completedSteps = nextSteps.filter((step) => step.isComplete).length;
const totalSteps = nextSteps.length;
const progressPercentage = (completedSteps / totalSteps) * 100;

export function NextStepsSection() {
	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-3xl font-bold tracking-tight">Your Next Steps</h2>
				<p className="mt-2 text-lg text-muted-foreground">
					Follow this roadmap to get your {siteConfig.title} app production-ready
				</p>
			</div>

			<Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Zap className="h-5 w-5 text-primary" />
						Setup Progress
					</CardTitle>
					<CardDescription>
						{completedSteps} of {totalSteps} steps completed
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span>{completedSteps} completed</span>
							<span>{Math.round(progressPercentage)}%</span>
						</div>
						<Progress value={progressPercentage} className="h-2" />
					</div>
				</CardContent>
			</Card>

			<div className="space-y-4">
				{nextSteps.map((step, index) => (
					<Card
						key={step.title}
						className={`transition-all ${
							step.isComplete
								? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
								: "hover:shadow-md"
						}`}
					>
						<CardHeader className="pb-3">
							<div className="flex items-start gap-4">
								<div className="flex-shrink-0 mt-1">
									{step.isComplete ? (
										<CheckCircle className="h-5 w-5 text-green-500" />
									) : (
										<Circle className="h-5 w-5 text-muted-foreground" />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-2">
										<step.icon />
										<CardTitle className="text-base">{step.title}</CardTitle>
										{step.isOptional && (
											<Badge variant="secondary" className="text-xs">
												Optional
											</Badge>
										)}
										<Badge variant="outline" className="text-xs">
											{step.estimatedTime}
										</Badge>
									</div>
									<CardDescription>{step.description}</CardDescription>
								</div>
								<div className="flex-shrink-0">
									{step.isComplete ? (
										<Badge
											variant="outline"
											className="bg-green-50 text-green-700 border-green-200"
										>
											Complete
										</Badge>
									) : (
										<Link href={step.href}>
											<Button variant="outline" size="sm" className="group">
												{step.isOptional ? "Setup" : "Configure"}
												<ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
											</Button>
										</Link>
									)}
								</div>
							</div>
						</CardHeader>
					</Card>
				))}
			</div>

			{completedSteps === totalSteps && (
				<Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800">
					<CardContent className="pt-6">
						<div className="text-center">
							<CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
							<h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
								🎉 Congratulations! You&apos;re all set up!
							</h3>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
