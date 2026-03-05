import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConnectionHighlightWrapper } from "@/app/(app)/settings/_components/connection-highlight-wrapper";
import { DeleteAccountCard } from "@/app/(app)/settings/_components/delete-account-card";
import { GitHubOAuthButton } from "@/components/buttons/github-oauth-button";
import { VercelConnectButton } from "@/components/buttons/vercel-connect-button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { getGitHubConnectionStatus } from "@/server/services/github/github-token-service";
import { checkVercelConnection } from "@/server/services/vercel/vercel-service";

export const metadata: Metadata = constructMetadata({
	title: "Account Settings",
	description: "Manage your account connections, linked services, and account preferences.",
});

export default async function AccountPage() {
	const session = await auth();
	if (!session?.user) redirect(routes.auth.signIn);

	const userId = session.user.id;

	// Check connections using server-side functions
	// Using unified getGitHubConnectionStatus() ensures isConnected and username are always consistent
	const [hasVercel, gitHubStatus] = await Promise.all([
		env.NEXT_PUBLIC_FEATURE_VERCEL_INTEGRATION_ENABLED
			? checkVercelConnection(userId)
			: Promise.resolve(false),
		getGitHubConnectionStatus(userId),
	]);

	const hasGitHub = gitHubStatus.isConnected;
	const gitHubUsername = gitHubStatus.username;

	// Define the connected accounts based on unified connection status
	const connectedAccounts = [
		{
			name: "GitHub",
			connected: hasGitHub,
			username: gitHubUsername,
		},
		{
			name: "GitLab",
			connected: false,
			username: null,
		},
		{
			name: "Bitbucket",
			connected: false,
			username: null,
		},
		// Add more providers here as they become available
	];

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Account</h3>
				<p className="text-sm text-muted-foreground">Manage your account settings.</p>
			</div>
			<Separator />

			{/* Vercel Connection — only show when the integration feature is enabled */}
			{env.NEXT_PUBLIC_FEATURE_VERCEL_INTEGRATION_ENABLED && (
				<ConnectionHighlightWrapper connectionType="vercel">
					<Card>
						<CardHeader>
							<CardTitle>Vercel Connection</CardTitle>
							<CardDescription>
								Connect your Vercel account to deploy projects directly.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<p>
									{hasVercel
										? "Your Vercel account is connected. You can now deploy projects directly to Vercel."
										: "Connect your Vercel account to deploy projects directly from Shipkit."}
								</p>
							</div>
						</CardContent>
						<CardFooter>
							<VercelConnectButton
								user={session?.user}
								isConnected={hasVercel}
								className="w-full"
							/>
						</CardFooter>
					</Card>
				</ConnectionHighlightWrapper>
			)}

			<ConnectionHighlightWrapper connectionType="github">
				<Card>
					<CardHeader>
						<CardTitle>GitHub Connection</CardTitle>
						<CardDescription>
							Connect your GitHub account with OAuth to enable repository creation and deployments.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<p>
								{hasGitHub
									? "Your GitHub account is connected via OAuth. You can now create repositories and deploy projects."
									: "Connect your GitHub account with OAuth to create repositories and deploy projects directly from Shipkit."}
							</p>
						</div>
					</CardContent>
					<CardFooter>
						<GitHubOAuthButton
							user={session?.user}
							isConnected={hasGitHub}
							githubUsername={gitHubUsername}
							className="w-full"
						/>
					</CardFooter>
				</Card>
			</ConnectionHighlightWrapper>

			{/* Connected Accounts */}
			{/* <Card>
				<CardHeader>
					<CardTitle>Connected Accounts</CardTitle>
					<CardDescription>
						Manage your connected accounts and authentication methods.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{connectedAccounts.map((account) => (
						<div
							key={account.name}
							className="flex items-center justify-between space-x-4"
						>
							<div className="flex flex-col space-y-1">
								<span className="font-medium">{account.name}</span>
								{account.connected ? (
									<span className="text-sm text-muted-foreground">
										Connected as {account.username}
									</span>
								) : (
									<span className="text-sm text-muted-foreground">
										Not connected
									</span>
								)}
							</div>
							<Button
								onClick={() => {

								}}
								variant={account.connected ? "outline" : "default"}
								disabled={!account.name.toLowerCase().includes("github")}
							>
								{account.connected ? "Disconnect" : "Connect"}
							</Button>
						</div>
					))}
				</CardContent>
			</Card> */}

			{/* Delete Account */}
			<DeleteAccountCard />
		</div>
	);
}
