import { DownloadIcon } from "lucide-react";
import { GitHubOAuthButton } from "@/components/buttons/github-oauth-button";
import { BuyButton } from "@/components/buttons/lemonsqueezy-buy-button";
import { LoginButton } from "@/components/buttons/sign-in-button";
import { DashboardVercelDeploy } from "@/components/modules/deploy/dashboard-vercel-deploy";
import { PrivateRepoDeployButton } from "@/components/modules/deploy/private-repo-deploy-button";
import { Link } from "@/components/primitives/link";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";
import { auth } from "@/server/auth";
import { getGitHubConnectionStatus } from "@/server/services/github/github-token-service";
import { checkVercelConnection } from "@/server/services/vercel/vercel-service";

interface DownloadSectionProps {
	isCustomer: boolean;
}

export const DownloadSection = async ({ isCustomer }: DownloadSectionProps) => {
	const session = await auth();

	// If not authenticated, show login button
	if (!session?.user) {
		return (
			<div className="flex flex-wrap items-stretch justify-stretch max-w-md">
				<LoginButton size="lg" className="w-full">
					Sign in to download {siteConfig.title}
				</LoginButton>
			</div>
		);
	}

	const userId = session.user.id;

	// If authenticated but not purchased, show buy button
	if (!isCustomer) {
		return (
			<div className="flex flex-wrap items-stretch justify-stretch max-w-md">
				<BuyButton className="w-full" />
				<p className="w-full text-sm text-muted-foreground mt-2">
					Purchase required to download {siteConfig.title}
				</p>
			</div>
		);
	}

	// Run all async operations in parallel
	const [gitHubStatus, isVercelConnected] = await Promise.all([
		getGitHubConnectionStatus(userId),
		checkVercelConnection(userId),
	]);

	// User is authenticated and has purchased, show download options
	return (
		<div className="flex flex-wrap items-stretch justify-stretch max-w-md gap-3">
			<div className="flex flex-wrap items-stretch justify-stretch w-full gap-3">
				<PrivateRepoDeployButton />
				{/* Download button - direct link instead of form action */}
				<Link
					href={routes.api.download}
					className={cn(buttonVariants({ variant: "default" }), "grow min-w-1/2 w-full")}
				>
					<DownloadIcon className="mr-2 h-4 w-4" />
					Download {siteConfig.title}
				</Link>

				{isVercelConnected && (
					<DashboardVercelDeploy className="grow min-w-1/2" isVercelConnected={isVercelConnected} />
				)}
			</div>
			{/* GitHub connection section */}
			<GitHubOAuthButton
				className="w-full"
				isConnected={gitHubStatus.isConnected}
				githubUsername={gitHubStatus.username}
			/>
		</div>
	);
};
