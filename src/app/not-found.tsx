/* Not Found Page Component
 * This is a special Next.js page that renders when a route isn't found (404 error)
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */

import { RootLayout } from "@/components/layouts/root-layout";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderHeading,
} from "@/components/primitives/page-header";
import { WavesBackground } from "@/components/ui/background-waves";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RocketIcon } from "lucide-react";
import Link from "next/link";

const config = {
	speed: 0.002,
	saturation: 12,
	brightness: 60,
	amplitude: 1,
	frequency: 1,
	layers: 3,
	fadeOpacity: 0.05,
	transparent: true,
};

export default function NotFound() {
	return (
		<RootLayout>
			<WavesBackground config={config} />
			<div className="container relative flex h-screen w-screen flex-col items-center justify-center">
				<div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
					<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
						<RocketIcon className="h-10 w-10 rotate-45 text-muted-foreground" />
					</div>
					<PageHeader className="bg-background/30 backdrop-blur-sm">
						<PageHeaderHeading className="w-full text-center">
							Lost in space
						</PageHeaderHeading>
						<PageHeaderDescription className="mb-8">
							The page you're looking for has drifted into deep space. Let's get
							you back to familiar territory.
						</PageHeaderDescription>
					</PageHeader>
					<Link
						href="/"
						className={cn(
							buttonVariants({
								variant: "default",
								size: "lg",
							}),
							"relative overflow-hidden",
						)}
					>
						<span className="relative z-10">Launch me back to earth</span>
						<div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary opacity-50 blur-xl transition-all duration-500 hover:opacity-75" />
					</Link>
				</div>
			</div>
		</RootLayout>
	);
}
