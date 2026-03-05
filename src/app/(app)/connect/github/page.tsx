"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Icons } from "@/components/assets/icons";
import { GitHubOAuthButton } from "@/components/buttons/github-oauth-button";
import { buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { cn } from "@/lib/utils";

// Simple client-only wrapper component
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		setHasMounted(true);
	}, []);

	if (!hasMounted) {
		return null;
	}

	return <>{children}</>;
};

export default function GitHubConnectPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { data: session, update: updateSession, status } = useSession();
	const [isProcessing, setIsProcessing] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Process GitHub connection response if parameters are present
	useEffect(() => {
		const processConnection = async () => {
			// Only process if authenticated and not already processing
			if (status !== "authenticated" || isProcessing) return;

			// Check if searchParams exists before trying to use it
			if (!searchParams) return;

			const code = searchParams.get(SEARCH_PARAM_KEYS.statusCode);
			if (!code) return;

			try {
				setIsProcessing(true);

				// Connections are now handled directly by the NextAuth callback
				// Just force a session update to make sure we have the latest data
				await updateSession({ force: true });

				setIsSuccess(true);

				// Redirect to settings after a short delay
				setTimeout(() => {
					const nextUrl = searchParams.get(SEARCH_PARAM_KEYS.nextUrl);
					router.push(nextUrl ?? routes.settings.account);
				}, 3000);
			} catch (error) {
				console.error("Error connecting GitHub:", error);
				setError(error instanceof Error ? error.message : "Failed to connect GitHub account");
			} finally {
				setIsProcessing(false);
			}
		};

		processConnection();
	}, [searchParams, status, isProcessing, updateSession, router]);

	const isConnected = !!session?.user?.githubUsername;

	if (status === "loading") {
		return (
			<div className="container mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center">
				<Card className="w-full">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl">Connecting GitHub Account</CardTitle>
						<CardDescription>Please wait while we process your GitHub connection</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
						<Icons.spinner className="h-8 w-8 animate-spin text-primary" />
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<ClientOnly>
			<div className="container mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center">
				<Card className="w-full">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl">GitHub Connection</CardTitle>
						<CardDescription>
							{isSuccess
								? "Your GitHub account has been connected successfully!"
								: isConnected
									? "Your GitHub account is already connected"
									: "Connect your GitHub account to access repository features"}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
						{error ? (
							<div className="rounded-lg bg-destructive/10 p-4 text-destructive">
								<p>{error}</p>
							</div>
						) : isSuccess ? (
							<div className="flex flex-col items-center justify-center space-y-4">
								<div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-500">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										className="h-10 w-10"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
								<p className="text-center">
									Successfully connected to GitHub as{" "}
									<strong>{session?.user?.githubUsername}</strong>
								</p>
								<p className="text-center text-sm text-muted-foreground">
									Redirecting to your profile settings...
								</p>
							</div>
						) : isConnected ? (
							<div className="flex flex-col items-center justify-center space-y-4">
								<Icons.github className="h-16 w-16" />
								<p className="text-center">
									Your account is connected to GitHub as{" "}
									<strong>{session?.user?.githubUsername}</strong>
								</p>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center space-y-4">
								<Icons.github className="h-16 w-16" />
								<p className="text-center">Connect your GitHub account to get started</p>
								<GitHubOAuthButton
									className="w-full"
									isConnected={isConnected}
									githubUsername={session?.user?.githubUsername}
								/>
							</div>
						)}
					</CardContent>
					<CardFooter className="flex justify-center">
						<Link
							href={routes.settings.profile}
							className={cn(buttonVariants({ variant: "outline" }))}
						>
							Back to Settings
						</Link>
					</CardFooter>
				</Card>
			</div>
		</ClientOnly>
	);
}
