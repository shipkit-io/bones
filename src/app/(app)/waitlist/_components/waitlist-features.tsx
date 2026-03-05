import {
	BarChart3,
	Brain,
	Code2,
	Coffee,
	CreditCard,
	FileText,
	Heart,
	Palette,
	Rocket,
	Shield,
	Smartphone,
	Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const painPoints = [
	{
		problem: "Spent 3 weeks setting up authentication... again",
		solution: "Auth works in 5 minutes",
		icon: Shield,
		gradient: "from-red-500 to-orange-500",
	},
	{
		problem: "Payment integration took longer than building the app",
		solution: "One-click Stripe setup",
		icon: CreditCard,
		gradient: "from-green-500 to-emerald-500",
	},
	{
		problem: "Database migrations are a nightmare",
		solution: "Type-safe schema & migrations",
		icon: Code2,
		gradient: "from-blue-500 to-cyan-500",
	},
	{
		problem: "Responsive design? More like responsive crying",
		solution: "Mobile-first components",
		icon: Smartphone,
		gradient: "from-purple-500 to-pink-500",
	},
];

const realFeatures = [
	{
		icon: Zap,
		title: "Actually Fast Setup",
		description:
			"Not 'fast' like other starters claim. We mean clone, npm install, and you're building features. Zero config BS.",
		tag: "Core",
	},
	{
		icon: Shield,
		title: "Auth That Works",
		description:
			"Social logins, magic links, 2FA, and session management. The stuff that usually takes weeks? It's done.",
		tag: "Auth",
	},
	{
		icon: CreditCard,
		title: "Payments That Don't Suck",
		description:
			"Stripe integration that handles subscriptions, one-time payments, and webhooks without the headaches.",
		tag: "Commerce",
	},
	{
		icon: Code2,
		title: "Database Without Drama",
		description:
			"PostgreSQL + Drizzle ORM. Migrations that work, types that match, queries that make sense.",
		tag: "Backend",
	},
	{
		icon: FileText,
		title: "Content Management",
		description:
			"Payload CMS integration for when your client inevitably says 'can I edit this myself?'",
		tag: "CMS",
	},
	{
		icon: Brain,
		title: "AI Integration",
		description: "OpenAI hooks and helpers because let's be honest, every app needs AI these days.",
		tag: "AI",
	},
	{
		icon: Palette,
		title: "Design System",
		description:
			"Shadcn/UI components with custom variants. Looks professional without hiring a designer.",
		tag: "Design",
	},
	{
		icon: BarChart3,
		title: "Analytics & Monitoring",
		description:
			"Error tracking, performance monitoring, and user analytics. Know when things break before your users do.",
		tag: "Observability",
	},
	{
		icon: Rocket,
		title: "Deploy Anywhere",
		description:
			"Vercel, Railway, or self-hosted. Docker configs included because sometimes you need control.",
		tag: "DevOps",
	},
];

const techStack = [
	{ name: "Next.js 15", description: "App Router, Server Components", emoji: "⚡" },
	{ name: "TypeScript", description: "End-to-end type safety", emoji: "🛡️" },
	{ name: "Tailwind CSS", description: "Utility-first styling", emoji: "🎨" },
	{ name: "Drizzle ORM", description: "Type-safe database", emoji: "🗄️" },
	{ name: "Auth.js v5", description: "Authentication", emoji: "🔐" },
	{ name: "Stripe", description: "Payment processing", emoji: "💳" },
	{ name: "Payload CMS", description: "Content management", emoji: "📝" },
	{ name: "Resend", description: "Email delivery", emoji: "📧" },
];

export function WaitlistFeatures() {
	return (
		<div className="py-24 bg-slate-50/50 dark:bg-slate-900/50">
			<div className="container px-4 md:px-6">
				{/* Pain Points Section */}
				<div className="mb-24">
					<div className="text-center mb-16">
						<Badge
							variant="outline"
							className="mb-4 border-red-200 text-red-700 dark:border-red-800 dark:text-red-300"
						>
							We've All Been There
						</Badge>
						<h2 className="mb-6 text-3xl md:text-4xl font-bold tracking-tight">
							Tired of Building the Same Stuff?
						</h2>
						<p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
							Every project starts the same way. Authentication, payments, email, database...
							<br />
							How many times have you built a user table?
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						{painPoints.map((item) => {
							const Icon = item.icon;
							return (
								<Card
									key={item.problem}
									className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
								>
									<CardContent className="p-6">
										<div className="relative">
											<div
												className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient} mb-4`}
											>
												<Icon className="h-6 w-6 text-white" />
											</div>
											<div className="space-y-3">
												<p className="text-sm text-slate-600 dark:text-slate-400 line-through">
													{item.problem}
												</p>
												<p className="font-semibold text-slate-900 dark:text-slate-100">
													✅ {item.solution}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>

				{/* Real Features */}
				<div className="mb-24">
					<div className="text-center mb-16">
						<Badge
							variant="outline"
							className="mb-4 border-green-200 text-green-700 dark:border-green-800 dark:text-green-300"
						>
							Everything Included
						</Badge>
						<h2 className="mb-6 text-3xl md:text-4xl font-bold tracking-tight">
							Actually Useful Features
						</h2>
						<p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
							Not a kitchen sink. Not a toy project. Real features that solve real problems for real
							applications.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{realFeatures.map((feature) => {
							const Icon = feature.icon;
							return (
								<Card
									key={feature.title}
									className="relative group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700"
								>
									<CardContent className="p-6">
										<div className="flex items-start gap-4">
											<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20 group-hover:bg-violet-200 dark:group-hover:bg-violet-900/40 transition-colors">
												<Icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
											</div>
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<h3 className="font-semibold text-slate-900 dark:text-slate-100">
														{feature.title}
													</h3>
													<Badge variant="secondary" className="text-xs">
														{feature.tag}
													</Badge>
												</div>
												<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
													{feature.description}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>

				{/* Tech Stack */}
				<div className="text-center">
					<Badge
						variant="outline"
						className="mb-6 border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300"
					>
						Modern Stack
					</Badge>
					<h3 className="mb-8 text-2xl font-bold text-slate-900 dark:text-slate-100">
						Built with Technologies You Actually Want to Use
					</h3>
					<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{techStack.map((tech) => (
							<div key={tech.name} className="group">
								<div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
									<div className="text-2xl mb-2">{tech.emoji}</div>
									<div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
										{tech.name}
									</div>
									<div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
										{tech.description}
									</div>
								</div>
							</div>
						))}
					</div>
					<div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
						<Coffee className="h-4 w-4" />
						<span>Made with lots of coffee and years of frustration</span>
						<Heart className="h-4 w-4 text-red-500" />
					</div>
				</div>
			</div>
		</div>
	);
}
