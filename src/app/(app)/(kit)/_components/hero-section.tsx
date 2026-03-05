"use client";

import { ArrowRight, Box, Code, Zap } from "lucide-react";
import { KitLogoParticles } from "@/app/(app)/(kit)/_components/kit-logo-particles";
import { Link } from "@/components/primitives/link";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderHeading,
} from "@/components/primitives/page-header";
import { BorderBeam } from "@/components/ui/border-beam";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site-config";

export function HeroSection() {
	return (
		<section className="relative w-full bg-background py-12 md:py-24 lg:py-32 xl:py-48">
			{/* Todo: fix hydration error */}
			{/* <BackgroundAnimation /> */}
			<div className="container relative z-10 px-4 md:px-6">
				<div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
					<div className="flex flex-col justify-center space-y-4">
						<PageHeader>
							<PageHeaderHeading className="text-3xl tracking-tighter sm:text-5xl xl:text-6xl/none">
								{siteConfig.title}:
								<br />
								The Next.js 15 Accelerator.
							</PageHeaderHeading>
							<PageHeaderDescription className="max-w-[600px] md:text-xl">
								Launch your Next.js projects with {siteConfig.title}. Fast, flexible, and
								feature-packed for the modern web.
							</PageHeaderDescription>
						</PageHeader>
						<div className="flex flex-col gap-2 min-[400px]:flex-row">
							<Link href="https://shipkit.io" className={buttonVariants({ size: "lg" })}>
								Get Started
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
							<Link
								href="https://shipkit.io/docs"
								className={buttonVariants({ variant: "outline", size: "lg" })}
							>
								View Docs
								<Code className="ml-2 h-4 w-4" />
							</Link>
						</div>
					</div>
					<div className="relative flex h-[400px] max-w-3xl flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
						<KitLogoParticles />
						<BorderBeam size={250} duration={12} delay={9} />
					</div>
				</div>
				<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					<div className="flex items-center space-x-3 rounded-lg bg-muted p-4">
						<Zap className="h-6 w-6 text-primary" />
						<p className="text-sm font-medium">Lightning-fast performance</p>
					</div>
					<div className="flex items-center space-x-3 rounded-lg bg-muted p-4">
						<Box className="h-6 w-6 text-primary" />
						<p className="text-sm font-medium">Pre-configured components</p>
					</div>
					<div className="flex items-center space-x-3 rounded-lg bg-muted p-4">
						<Code className="h-6 w-6 text-primary" />
						<p className="text-sm font-medium">TypeScript ready</p>
					</div>
				</div>
			</div>
		</section>
	);
}
