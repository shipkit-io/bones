// This must be a server component

import { RocketIcon } from "lucide-react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AppRouterLayout } from "@/components/layouts/app-router-layout";
import { Link } from "@/components/primitives/link";
// import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/primitives/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NotFoundTerminalBackground } from "../ui/backgrounds/background-terminal";

interface NotFoundPageProps {
	containerClassName?: string;
	descriptionClassName?: string;
	statusCode?: number;
}

const NoOpProvider = ({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) => <>{children}</>;

export const NotFoundPage = ({
	containerClassName,
	descriptionClassName,
	statusCode = 404,
}: NotFoundPageProps) => {
	return (
		<AppRouterLayout themeProvider={NoOpProvider}>
			<div className="relative h-screen w-screen">
				{/* Animated background (client-only) */}
				<div className="absolute inset-0 z-0">
					<NotFoundTerminalBackground />
				</div>

				<div className="container relative z-10 flex h-full w-full flex-col items-center justify-center px-4 sm:px-6">
					<Card
						className={cn(
							"mx-auto w-full max-w-md bg-background/80 backdrop-blur-sm",
							containerClassName
						)}
					>
						<CardHeader className="items-center text-center">
							<div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
								<RocketIcon className="h-8 w-8 rotate-45 text-muted-foreground" />
							</div>
							<CardTitle className="text-2xl sm:text-3xl">Lost in space</CardTitle>
							<CardDescription className={cn("text-base", descriptionClassName)}>
								<span className="mr-2 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
									{statusCode}
								</span>
								The page you&apos;re looking for has drifted into deep space.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col items-center gap-4">
							<Link
								href="/"
								className={cn(
									buttonVariants({ variant: "default", size: "lg" }),
									"relative w-full overflow-hidden sm:w-auto"
								)}
							>
								<span className="relative z-10">Take me home</span>
								<div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary opacity-50 blur-xl transition-all duration-500 hover:opacity-75" />
							</Link>
							<p className="text-center text-sm text-muted-foreground">
								We can&apos;t find the page you&apos;re looking for.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</AppRouterLayout>
	);
};
