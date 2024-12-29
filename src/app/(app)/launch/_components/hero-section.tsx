"use client";

import { Link } from "@/components/primitives/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { ArrowRight, Box, Code, Zap } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { HeroGraphic } from "./hero-graphic";

const items = [...Array(100)].map(() => (
	<div
		key={uuidv4()}
		className="h-1 w-1 animate-pulse rounded-full bg-gray-500"
		style={{
			position: "absolute",
			top: `${Math.random() * 100}%`,
			left: `${Math.random() * 100}%`,
			animationDelay: `${Math.random() * 5}s`,
			animationDuration: `${2 + Math.random() * 5}s`,
		}}
	/>
))

const BackgroundAnimation = () => {

	return (
		<div className="absolute inset-0 overflow-hidden">
			<div className="bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] absolute inset-0 bg-[bottom_1px_center] dark:border-b dark:border-slate-100/5 dark:bg-bottom" />
			<div className="absolute inset-0 flex items-center justify-center">
				{items}
			</div>
		</div>
	);
};

export function HeroSection() {
	return (
		<section className="relative w-full bg-background py-12 md:py-24 lg:py-32 xl:py-48">
			<BackgroundAnimation />
			<div className="container relative z-10 px-4 md:px-6">
				<div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
					<div className="flex flex-col justify-center space-y-4">
						<div className="space-y-2">
							<h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
								{siteConfig.name}:
								<br />
								The Next.js 15 Accelerator.
							</h1>
							<p className="max-w-[600px] text-muted-foreground md:text-xl">
								Launch your Next.js projects with {siteConfig.name}. Fast,
								flexible, and feature-packed for the modern web.
							</p>
						</div>
						<div className="flex flex-col gap-2 min-[400px]:flex-row">
							<Link
								href="https://shipkit.io"
								className={buttonVariants({ size: "lg" })}
							>
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
					<div className="flex items-center justify-center">
						<div className="relative flex h-[400px] max-w-3xl flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
							<HeroGraphic />
							<BorderBeam size={250} duration={12} delay={9} />
						</div>
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
