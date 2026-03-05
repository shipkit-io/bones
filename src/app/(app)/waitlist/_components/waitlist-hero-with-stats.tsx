import { Suspense } from "react";
import { WaitlistHero } from "./waitlist-hero";
import { WaitlistStats } from "./waitlist-stats";

export function WaitlistHeroWithStats() {
	return (
		<section className="relative w-full overflow-hidden py-12 md:py-24 lg:py-32">
			{/* Background gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20" />

			{/* Grid pattern overlay */}
			<div className="absolute inset-0 bg-grid-small-black/[0.02] dark:bg-grid-small-white/[0.02]" />

			<div className="container relative z-10 px-4 md:px-6">
				<div className="mx-auto max-w-4xl text-center">
					{/* Content from WaitlistHero but with server-side stats */}
					<WaitlistHero />

					{/* Replace the hardcoded stats with real ones */}
					<div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl">
						<Suspense
							fallback={
								<div className="mb-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
									<div className="flex items-center gap-2">
										<div className="h-4 w-4 bg-primary/20 rounded animate-pulse" />
										<span>Loading stats...</span>
									</div>
								</div>
							}
						>
							<WaitlistStats />
						</Suspense>
					</div>
				</div>
			</div>
		</section>
	);
}
