"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/assets/icons";
import { Link } from "@/components/primitives/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";
import { disconnectGitHub } from "@/server/actions/github";
import type { User } from "@/types/user";
import { STATUS_CODES } from "@/config/status-codes";
import { routes } from "@/config/routes";
import { createRedirectUrl } from "@/lib/utils/redirect";

interface GitHubOAuthButtonProps {
	className?: string;
	user?: User;
	/** Server-side connection status - preferred over checking session */
	isConnected?: boolean;
	/** The GitHub username from the OAuth account */
	githubUsername?: string | null;
}

export const GitHubOAuthButton = ({
	className,
	user,
	isConnected: isConnectedProp,
	githubUsername,
}: GitHubOAuthButtonProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	// Use prop if provided
	const isConnected = isConnectedProp ?? false;

	const handleConnect = async () => {
		try {
			setIsLoading(true);

			// Get the callback URL - return to settings page with success param
			const callbackUrl = createRedirectUrl(routes.settings.account, { code: STATUS_CODES.CONNECT_GITHUB.code });

			// Use NextAuth's signIn to trigger the OAuth flow
			// This will redirect to GitHub for authorization
			// The auth callbacks will automatically:
			// 1. Store the GitHub username in the database
			// 2. Grant collaborator access to the repository
			await signIn("github", {
				callbackUrl,
				redirect: true,
			});
		} catch (error) {
			console.error("GitHub connect error:", error);
			toast.error(error instanceof Error ? error.message : "Failed to connect to GitHub");
			setIsLoading(false);
		}
	};

	const handleDisconnect = async () => {
		if (isLoading) return;

		setIsLoading(true);
		try {
			// Use the disconnectGitHub action which also revokes repository access
			await disconnectGitHub();
			toast.success("GitHub account disconnected successfully");

			// Refresh to update the UI with the new connection state
			router.refresh();
		} catch (error) {
			console.error("Disconnect GitHub error:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to disconnect GitHub account"
			);
		} finally {
			setIsLoading(false);
		}
	};

	// If connected but no username, something is wrong - log it for debugging
	if (isConnected && !githubUsername) {
		console.warn("[GitHubOAuthButton] Connected but no username - this should not happen");
	}

	return (
		<>
			{isConnected && githubUsername ? (
				<div className={cn("flex flex-col items-center justify-center gap-1", className)}>
					<Link
						href={siteConfig.repo.url}
						className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Icons.github className="mr-2 h-4 w-4" />
						View Repository
					</Link>
					<Tooltip delayDuration={200}>
						<TooltipTrigger asChild>
							<Button
								onClick={() => void handleDisconnect()}
								variant="link"
								size="sm"
								disabled={isLoading}
								className="text-muted-foreground"
							>
								{isLoading
									? "Disconnecting..."
									: `Not ${githubUsername}? Disconnect from GitHub.`}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Remove GitHub repository access for {githubUsername}</p>
						</TooltipContent>
					</Tooltip>
				</div>
			) : (
				<Button
					size="lg"
					onClick={() => void handleConnect()}
					disabled={isLoading}
					className={cn("w-full", className)}
				>
					<Icons.github className="mr-2 h-4 w-4" />
					{isLoading ? "Connecting..." : "Connect GitHub with OAuth"}
				</Button>
			)}
		</>
	);
};
