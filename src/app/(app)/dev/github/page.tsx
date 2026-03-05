"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/assets/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { disconnectGitHub, updateGitHubUsername } from "@/server/actions/github";

// Ensure GitHubSession matches the expected session structure
interface GitHubSession {
	user?: {
		id?: string;
		email?: string;
		githubUsername?: string | null;
	};
}

export default function DevToolsGitHubPage() {
	const { data: session, update: updateSession, status } = useSession();
	const [isLoadingConnect, setIsLoadingConnect] = useState(false);
	const [isLoadingDisconnect, setIsLoadingDisconnect] = useState(false);
	const [usernameInput, setUsernameInput] = useState("");

	const user = (session as GitHubSession | null)?.user;
	const githubUsername = user?.githubUsername;
	const isConnected = !!githubUsername;
	const isAuthenticated = status === "authenticated";

	// Effect to update input field when username changes (e.g., after connect/disconnect)
	useEffect(() => {
		setUsernameInput(githubUsername || "");
	}, [githubUsername]);

	const handleConnectOrUpdate = async () => {
		if (!user?.id || !usernameInput.trim()) {
			toast.warning("Please enter a GitHub username.");
			return;
		}
		// Avoid updating if the username hasn't changed
		if (isConnected && usernameInput.trim() === githubUsername) {
			toast.info("GitHub username is already set to this value.");
			return;
		}

		setIsLoadingConnect(true);
		try {
			const result = await updateGitHubUsername(usernameInput.trim());
			if (result.success) {
				// Session update will happen via server action revalidation
				toast.success(
					`GitHub username ${isConnected ? "updated to" : "set to"}: ${result.githubUsername}`
				);
			} else {
				toast.error("Failed to update GitHub username.");
			}
		} catch (error) {
			console.error("GitHub connect/update error:", error);
			toast.error(error instanceof Error ? error.message : "Failed to update GitHub username.");
		} finally {
			setIsLoadingConnect(false);
		}
	};

	const handleDisconnect = async () => {
		if (!user?.id || !isConnected) return;

		setIsLoadingDisconnect(true);
		try {
			await disconnectGitHub();
			// Force a session update to reflect the change immediately
			await updateSession({ force: true });
			toast.success("GitHub account disconnected successfully");
			setUsernameInput(""); // Clear input
		} catch (error) {
			console.error("GitHub disconnect error:", error);
			toast.error(error instanceof Error ? error.message : "Failed to disconnect GitHub account.");
		} finally {
			setIsLoadingDisconnect(false);
		}
	};

	if (status === "loading") {
		return (
			<div className="flex justify-center items-center h-full">
				<Icons.spinner className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return <p>Please log in to manage GitHub connection.</p>;
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>DevTools: GitHub Connection Management</CardTitle>
					<CardDescription>
						Manually connect, update, or disconnect the GitHub username associated with your
						account.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<p className="text-sm font-medium">
							Current Status:{" "}
							{isConnected ? (
								<span className="text-green-600">Connected as {githubUsername}</span>
							) : (
								<span className="text-red-600">Not Connected</span>
							)}
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="github-username">GitHub Username</Label>
						<Input
							id="github-username"
							value={usernameInput}
							onChange={(e) => setUsernameInput(e.target.value)}
							placeholder="Enter GitHub Username"
							disabled={isLoadingConnect || isLoadingDisconnect}
						/>
					</div>
					<div className="flex flex-col sm:flex-row gap-2">
						<Button
							onClick={() => void handleConnectOrUpdate()}
							disabled={isLoadingConnect || isLoadingDisconnect || !usernameInput.trim()}
							className="w-full sm:w-auto"
						>
							{isLoadingConnect ? (
								<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Icons.github className="mr-2 h-4 w-4" />
							)}
							{isConnected ? "Update Username" : "Connect Username"}
						</Button>
						{isConnected && (
							<Button
								variant="destructive"
								onClick={() => void handleDisconnect()}
								disabled={isLoadingDisconnect}
								className="w-full sm:w-auto"
							>
								{isLoadingDisconnect && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
								Disconnect
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
