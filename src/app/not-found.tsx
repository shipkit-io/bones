import { RootLayout } from "@/components/layouts/root-layout";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Link } from "@/components/primitives/link";

export default function NotFound() {
	return (
		<RootLayout>
			<div className="container flex h-screen w-screen flex-col items-center justify-center">
				<h1 className="text-4xl font-bold">404</h1>
				<p className="mb-8 mt-4 text-center text-muted-foreground">
					The page you&apos;re looking for doesn&apos;t exist.
				</p>
				<Link
					href="/"
					className={cn(buttonVariants({ variant: "default" }), "mt-4")}
				>
					Back to Home
				</Link>
			</div>
		</RootLayout>
	);
}
