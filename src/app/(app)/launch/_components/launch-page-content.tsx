import { FAQ } from "@/app/(app)/(landing)/_components/faq";
import { ParticlesHero } from "@/app/(app)/(landing)/_components/particles-hero";
import { PricingSectionSubtle } from "@/app/(app)/(landing)/_components/pricing-section-subtle";
import { Link } from "@/components/primitives/link";
import { Section } from "@/components/primitives/section";
import { buttonVariants } from "@/components/ui/button";
import { CodeWindow } from "@/components/ui/code-window";
import { routes } from "@/config/routes";
import { auth } from "@/server/auth";
import { RocketIcon } from "lucide-react";

const quickStartSteps = [
	{
		title: "Choose Your Plan",
		description: "Select the plan that matches your project needs",
		icon: "🎯",
	},
	{
		title: "Get Instant Access",
		description: "Receive immediate access to your codebase",
		icon: "⚡",
	},
	{
		title: "Start Building",
		description: "Follow our quick start guide and launch fast",
		icon: "🚀",
	},
];

const codeExample = `# Clone the repository
git clone https://github.com/your-username/shipkit.git

# Install dependencies
npm install

# Start development server
npm run dev

# Your app is now running at http://localhost:3000 🚀`;

export async function LaunchPageContent() {
	const session = await auth();
	const user = session?.user;

	// Otherwise, render our default content
	return (
		<ParticlesHero className="flex flex-col items-center justify-center px-4">
			<div className="flex w-full flex-col">
				{/* Hero Section */}
				<div className="flex w-full flex-col gap-24 py-24">

					{/* Quick Start Steps */}
					<Section className="container">
						<h2 className="mb-12 text-center text-3xl font-bold">
							Launch in Minutes
						</h2>
						<div className="grid gap-8 md:grid-cols-3">
							{quickStartSteps.map((step) => (
								<div
									key={step.title}
									className="flex flex-col items-center text-center"
								>
									<div className="mb-4 text-4xl">{step.icon}</div>
									<h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
									<p className="text-muted-foreground">{step.description}</p>
								</div>
							))}
						</div>
					</Section>

					<div className="container relative z-10 mx-auto flex flex-col items-center justify-center gap-4 text-center mt-header">
						<h1 className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
							Launch Your App Today
						</h1>
						<p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
							Get instant access to production-ready code and start building right
							away.
						</p>

						<div className="flex gap-4">
							<Link className={buttonVariants()} href={routes.external.buy}>
								Buy Now
							</Link>
							{!user && (
								<Link
									href={routes.auth.signIn}
									className={buttonVariants({ variant: "outline" })}
								>
									Sign In
								</Link>
							)}
						</div>
					</div>


					{/* Code Preview */}
					<Section className="container">
						<div className="mx-auto max-w-4xl">
							<CodeWindow
								title="Quick Start"
								language="bash"
								code={codeExample}
							/>
						</div>
					</Section>

					{/* Pricing Section */}
					<Section className="container">
						<h2 className="mb-12 text-center text-3xl font-bold">
							Ready to Launch?
						</h2>
						<PricingSectionSubtle />
					</Section>

					{/* FAQ Section */}
					<Section className="container">
						<FAQ />
					</Section>

					{/* Final CTA */}
					<Section className="container">
						<div className="mx-auto max-w-2xl text-center">
							<RocketIcon className="mx-auto mb-6 size-12 text-primary" />
							<h2 className="mb-4 text-3xl font-bold">Ready for Takeoff?</h2>
							<p className="mb-8 text-muted-foreground">
								Join developers who are building production-ready applications
								with ShipKit.
							</p>
							<Link className={buttonVariants()} href={routes.external.buy}>
								Buy Now
							</Link>
						</div>
					</Section>
				</div>
			</div>
		</ParticlesHero>
	);
}
