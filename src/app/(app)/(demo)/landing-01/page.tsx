import { ArrowRight, Box, Code2, GitBranch, Layers, Palette, Shield, Zap } from "lucide-react";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderHeading,
} from "@/components/primitives/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
	{
		id: "lightning-fast",
		title: "Lightning Fast",
		description:
			"Built on Next.js 13 with React Server Components for optimal performance and instant page loads.",
		icon: Zap,
		color: "text-yellow-500",
	},
	{
		id: "type-safe",
		title: "Type-Safe",
		description:
			"Full TypeScript support with strict type checking for robust, error-free development.",
		icon: Shield,
		color: "text-blue-500",
	},
	{
		id: "component-library",
		title: "Component Library",
		description: "Pre-built, accessible components powered by shadcn/ui and Radix UI primitives.",
		icon: Box,
		color: "text-purple-500",
	},
	{
		id: "modern-stack",
		title: "Modern Stack",
		description: "Includes Tailwind CSS, ESLint, and other modern tools configured out of the box.",
		icon: Layers,
		color: "text-green-500",
	},
	{
		id: "beautiful-ui",
		title: "Beautiful UI",
		description: "Stunning design system with dark mode support and customizable themes.",
		icon: Palette,
		color: "text-pink-500",
	},
	{
		id: "developer-experience",
		title: "Developer Experience",
		description: "Hot reloading, detailed error reporting, and intuitive project structure.",
		icon: Code2,
		color: "text-orange-500",
	},
];

export default function FeaturesPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Hero Section */}
			<section className="relative py-20">
				<div className="container px-4 mx-auto">
					<PageHeader className="max-w-3xl mx-auto text-center mb-16">
						<PageHeaderHeading className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
							Supercharge Your Next.js Development
						</PageHeaderHeading>
						<PageHeaderDescription>
							Everything you need to build modern web applications, carefully crafted for the
							perfect development experience.
						</PageHeaderDescription>
					</PageHeader>

					{/* Features Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
						{features.map((feature) => (
							<Card key={feature.id} className="p-6 hover:shadow-lg transition-shadow">
								<div className={`${feature.color} mb-4`}>
									<feature.icon size={24} />
								</div>
								<h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
								<p className="text-muted-foreground">{feature.description}</p>
							</Card>
						))}
					</div>

					{/* CTA Section */}
					<div className="mt-20 text-center">
						<div className="inline-flex items-center p-1 bg-secondary rounded-full">
							<GitBranch className="w-5 h-5 mr-2" />
							<span className="text-sm font-medium px-2 py-1">Open Source</span>
						</div>
						<h2 className="text-3xl font-bold mt-4 mb-8">Ready to Start Building?</h2>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button size="lg" className="gap-2">
								Get Started
								<ArrowRight className="w-4 h-4" />
							</Button>
							<Button size="lg" variant="outline">
								View Documentation
							</Button>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
