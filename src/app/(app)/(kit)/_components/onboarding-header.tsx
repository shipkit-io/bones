import { BookOpen, CheckCircle } from "lucide-react";
import { Link } from "@/components/primitives/link";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RainbowButton } from "@/components/ui/magicui/rainbow-button";

export function OnboardingHeader() {
	return (
		<div className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 py-16">
			<div className="absolute inset-0 bg-grid-pattern opacity-5" />
			<div className="container relative mx-auto px-4">
				<div className="mx-auto max-w-4xl text-center">
					<div className="mb-6 flex items-center justify-center gap-2">
						<CheckCircle className="h-8 w-8 text-green-500" />
						<Badge variant="secondary" className="px-3 py-1 text-sm">
							Installation Complete
						</Badge>
					</div>

					<h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
						Welcome to{" "}
						<span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
							Shipkit
						</span>
					</h1>

					<p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
						🎉 Congratulations! You've successfully deployed Shipkit. Now let's get you set up and
						ready to build amazing things. Below you'll find everything you need to configure your
						features and start shipping.
					</p>

					<div className="flex gap-4 flex-row justify-center">
						<Link href={routes.docs} className="inline-flex">
							<RainbowButton>
								<BookOpen className="mr-2 h-4 w-4" />
								View Documentation
							</RainbowButton>
						</Link>
					</div>

					<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-6">
						<div className="flex items-center gap-1">
							<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
							<span>Ready</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
