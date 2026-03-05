"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/assets/icons";
import { Link } from "@/components/primitives/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";
import { disconnectGitHub, updateGitHubUsername } from "@/server/actions/github";
import { createRedirectUrl } from "@/lib/utils/redirect";
import { routes } from "@/config/routes";

interface GitHubSession {
	user: {
		id: string;
		email: string;
		githubUsername?: string | null;
	};
}

export const GitHubConnectButton = ({ className }: { className?: string }) => {
	const router = useRouter();
	const pathname = usePathname();
	const { data: session, update: updateSession, status } = useSession();
	const [isLoading, setIsLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [usernameInput, setUsernameInput] = useState("");
	const user = (session as GitHubSession)?.user;
	const githubUsername = user?.githubUsername;
	const isConnected = !!githubUsername;
	const isAuthenticated = status === "authenticated";

	// Prefill input with current username when opening dialog
	useEffect(() => {
		if (dialogOpen) {
			setUsernameInput(githubUsername || "");
		}
	}, [dialogOpen, githubUsername]);

	const handleConnect = async () => {
		if (!user?.id || !usernameInput.trim()) return;
		if (isConnected && usernameInput.trim() === githubUsername) {
			toast.info("GitHub username is already set to this value.");
			setDialogOpen(false);
			return;
		}

		setIsLoading(true);
		try {
			const result = await updateGitHubUsername(usernameInput.trim());
			if (result.success) {
				toast.success(
					`GitHub username ${isConnected ? "updated to" : "set to"}: ${result.githubUsername}`
				);
				// Refresh client session and current route to update both client and server components
				await updateSession({ force: true });
				// If we're on the settings page, add highlight parameter
				if (pathname?.includes(routes.settings.index)) {
					const redirectUrl = createRedirectUrl(routes.settings.account, { code: "GITHUB_CONNECTED" });
					router.push(redirectUrl);
				} else {
					router.refresh();
				}
				setDialogOpen(false);
			} else {
				toast.error("Failed to update GitHub username. Please try again.");
			}
		} catch (error) {
			console.error("GitHub connect error:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update GitHub username. Please try again."
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDisconnect = async () => {
		if (!user?.id) return;

		try {
			setIsLoading(true);
			await disconnectGitHub();
			// Force a full session update to ensure the UI reflects the change
			await updateSession({ force: true });
			router.refresh();
			toast.success("GitHub account disconnected successfully");
		} catch (error) {
			console.error("GitHub disconnect error:", error);
			toast.error("Failed to disconnect GitHub account. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			{isConnected ? (
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
								{isLoading ? "Disconnecting..." : `Not ${githubUsername}? Disconnect from GitHub.`}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								{isConnected
									? `Remove GitHub repository access for ${githubUsername}`
									: "Connect your GitHub account"}
							</p>
						</TooltipContent>
					</Tooltip>
				</div>
			) : (
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button
							disabled={status === "loading" || !isAuthenticated}
							className={cn("w-full", className)}
						>
							<Icons.github className="mr-2 h-4 w-4" />
							{status === "loading"
								? "Loading..."
								: !isAuthenticated
									? "Login to Connect GitHub"
									: "Connect GitHub"}
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Connect GitHub Account</DialogTitle>
							<DialogDescription>
								Enter your GitHub username to connect your account manually.
							</DialogDescription>
						</DialogHeader>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								void handleConnect();
							}}
						>
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor="github-username" className="text-right">
										Username
									</Label>
									<Input
										id="github-username"
										value={usernameInput}
										onChange={(e) => setUsernameInput(e.target.value)}
										className="col-span-3"
										placeholder="Your GitHub Username"
										disabled={isLoading}
									/>
								</div>
							</div>
							<DialogFooter className="sm:justify-between">
								<DialogClose asChild>
									<Button type="button" variant="secondary" disabled={isLoading}>
										Cancel
									</Button>
								</DialogClose>
								<Button type="submit" disabled={isLoading || !usernameInput.trim()}>
									{isLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
									Connect Account
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
};
