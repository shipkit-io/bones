import type { Metadata } from "next";
import {
	CheckCircleIcon,
	CreditCardIcon,
	DownloadIcon,
	GitBranchIcon,
	InfoIcon,
	TerminalIcon,
	UserIcon,
	XCircleIcon,
} from "lucide-react";
import { GitHubOAuthButton } from "@/components/buttons/github-oauth-button";
import { Link } from "@/components/primitives/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CodeWindow } from "@/components/ui/code-window";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";
import { auth } from "@/server/auth";
import { getGitHubConnectionStatus } from "@/server/services/github/github-token-service";
import { PaymentService } from "@/server/services/payment-service";

export const metadata: Metadata = constructMetadata({
	title: "Download",
	description: `Download ${siteConfig.name} and get started with the complete source code, documentation, and all features.`,
});

const installationCode = `# Clone the repository
git clone ${siteConfig.repo.url}

# Change directory
cd ${siteConfig.branding.projectSlug}

# Install dependencies
bun install --frozen-lockfile

# Start the development server
bun dev`;

const dockerCode = `# Clone the repository
git clone ${siteConfig.repo.url}

# Change directory
cd ${siteConfig.branding.projectSlug}

# Build the Docker image
docker build -t ${siteConfig.branding.projectSlug} .

# Run the container
docker run -p 3000:3000 ${siteConfig.branding.projectSlug}`;

interface DownloadState {
	isAuthenticated: boolean;
	hasPurchased: boolean;
	hasGitHubConnection: boolean;
	githubUsername?: string | null;
	userEmail?: string;
}

export default async function DownloadPage() {
	const session = await auth();
	const hasPurchased = session?.user?.id
		? await PaymentService.getUserPaymentStatus(session.user.id)
		: false;
	const gitHubStatus = session?.user?.id
		? await getGitHubConnectionStatus(session.user.id)
		: { isConnected: false, username: null };

	const downloadState: DownloadState = {
		isAuthenticated: !!session?.user,
		hasPurchased,
		hasGitHubConnection: gitHubStatus.isConnected,
		githubUsername: gitHubStatus.username,
		userEmail: session?.user?.email || undefined,
	};

	return (
		<main className="container py-8">
			<div className="mx-auto max-w-4xl space-y-8">
				{/* Header Section */}
				<div className="text-center space-y-4">
					<h1 className="text-4xl font-bold tracking-tight">Download {siteConfig.name}</h1>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						Get started with the premium Next.js boilerplate that includes everything you need to
						build and ship your product fast.
					</p>
				</div>

				{/* Status Card */}
				<StatusCard downloadState={downloadState} />

				{/* Download Options */}
				<div className="grid gap-6 md:grid-cols-2">
					<DirectDownloadCard downloadState={downloadState} />
					<GitHubAccessCard downloadState={downloadState} />
				</div>

				{/* Installation Preview */}
				<InstallationPreview />

				{/* Support Section */}
				<SupportSection />
			</div>
		</main>
	);
}

function StatusCard({ downloadState }: { downloadState: DownloadState }) {
	const { isAuthenticated, hasPurchased, userEmail } = downloadState;

	let status: "success" | "warning" | "error" = "error";
	let title = "";
	let description = "";
	let action = null;

	if (!isAuthenticated) {
		status = "error";
		title = "Sign In Required";
		description =
			"Please sign in with the same email address you used during checkout to access your download.";
		action = (
			<Link
				href={`${routes.auth.signIn}?${SEARCH_PARAM_KEYS.nextUrl}=${routes.download}`}
				className={buttonVariants({ variant: "default" })}
			>
				<UserIcon className="mr-2 h-4 w-4" />
				Sign In
			</Link>
		);
	} else if (!hasPurchased) {
		status = "warning";
		title = "Purchase Required";
		description = `You're signed in as ${userEmail}, but we don't have a purchase record for this email. Please purchase ${siteConfig.name} or sign in with the email you used during checkout.`;
		action = (
			<Link
				href={`${routes.external.buy}?${SEARCH_PARAM_KEYS.nextUrl}=${routes.download}`}
				className={buttonVariants({ variant: "default" })}
			>
				<CreditCardIcon className="mr-2 h-4 w-4" />
				Purchase Now
			</Link>
		);
	} else {
		status = "success";
		title = "Ready to Download";
		description = `Welcome back, ${userEmail}! You have full access to ${siteConfig.name}. Choose your preferred download method below.`;
	}

	return (
		<Card
			className={cn(
				"border-2",
				status === "success" &&
				"border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
				status === "warning" &&
				"border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
				status === "error" && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
			)}
		>
			<CardHeader>
				<div className="flex items-center gap-3">
					{status === "success" && (
						<CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
					)}
					{status === "warning" && (
						<InfoIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
					)}
					{status === "error" && <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
					<CardTitle className="text-lg">{title}</CardTitle>
				</div>
				<CardDescription className="text-base">{description}</CardDescription>
			</CardHeader>
			{action && <CardFooter>{action}</CardFooter>}
		</Card>
	);
}

function DirectDownloadCard({ downloadState }: { downloadState: DownloadState }) {
	const { isAuthenticated, hasPurchased } = downloadState;
	const isEnabled = isAuthenticated && hasPurchased;

	return (
		<Card className={cn(!isEnabled && "opacity-50")}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<DownloadIcon className="h-5 w-5" />
						Direct Download
					</CardTitle>
					{isEnabled && <Badge variant="secondary">Recommended</Badge>}
				</div>
				<CardDescription>
					Download a ZIP file containing the complete {siteConfig.name} codebase. Perfect for
					getting started quickly.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="space-y-2 text-sm text-muted-foreground">
					<li className="flex items-center gap-2">
						<CheckCircleIcon className="h-4 w-4 text-green-500" />
						Complete source code
					</li>
					<li className="flex items-center gap-2">
						<CheckCircleIcon className="h-4 w-4 text-green-500" />
						All components and features
					</li>
					<li className="flex items-center gap-2">
						<CheckCircleIcon className="h-4 w-4 text-green-500" />
						Documentation included
					</li>
					<li className="flex items-center gap-2">
						<CheckCircleIcon className="h-4 w-4 text-green-500" />
						No Git history (smaller download)
					</li>
				</ul>
			</CardContent>
			<CardFooter>
				{isEnabled ? (
					<Link
						href={routes.api.download}
						className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-full")}
					>
						<DownloadIcon className="mr-2 h-4 w-4" />
						Download ZIP
					</Link>
				) : (
					<Button variant="default" size="lg" className="w-full" disabled>
						<DownloadIcon className="mr-2 h-4 w-4" />
						Download ZIP
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}

function GitHubAccessCard({ downloadState }: { downloadState: DownloadState }) {
	const { isAuthenticated, hasPurchased, hasGitHubConnection, githubUsername } = downloadState;
	const isEnabled = isAuthenticated && hasPurchased;

	return (
		<Card className={cn(!isEnabled && "opacity-50")}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<GitBranchIcon className="h-5 w-5" />
						GitHub Access
					</CardTitle>
					{hasGitHubConnection && <Badge variant="outline">Connected</Badge>}
				</div>
				<CardDescription>
					Connect your GitHub account to clone the repository directly and get automatic updates.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="space-y-2 text-sm text-muted-foreground">
					<li className="flex items-center gap-2">
						<CheckCircleIcon className="h-4 w-4 text-green-500" />
						Full Git history
					</li>
					<li className="flex items-center gap-2">
						<CheckCircleIcon className="h-4 w-4 text-green-500" />
						Automatic updates
					</li>
					<li className="flex items-center gap-2">
						<CheckCircleIcon className="h-4 w-4 text-green-500" />
						GitHub support
					</li>
					<li className="flex items-center gap-2">
						<CheckCircleIcon className="h-4 w-4 text-green-500" />
						Collaborative development
					</li>
				</ul>
			</CardContent>
			<CardFooter>
				<div className="w-full space-y-3">
					{isEnabled ? (
						<GitHubOAuthButton
							isConnected={hasGitHubConnection}
							githubUsername={githubUsername}
						/>
					) : (
						<Button disabled className="w-full">
							<GitBranchIcon className="mr-2 h-4 w-4" />
							Connect GitHub
						</Button>
					)}
					{hasGitHubConnection && isEnabled && (
						<Alert>
							<InfoIcon className="h-4 w-4" />
							<AlertDescription>
								You can now clone the repository directly:
								<CodeWindow
									code={`git clone ${siteConfig.repo.url}`}
									language="bash"
									variant="single"
									showLineNumbers={false}
									className="mt-2"
								/>
							</AlertDescription>
						</Alert>
					)}
				</div>
			</CardFooter>
		</Card>
	);
}

function InstallationPreview() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TerminalIcon className="h-5 w-5" />
					Installation Preview
				</CardTitle>
				<CardDescription>Here's what you'll do after downloading {siteConfig.name}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div>
					<h4 className="font-semibold mb-3">Quick Start (Recommended)</h4>
					<CodeWindow
						title="Terminal"
						code={installationCode}
						language="bash"
						showLineNumbers={false}
						theme="dark"
						variant="minimal"
					/>
				</div>

				{/* <div>
					<h4 className="font-semibold mb-3">Using Docker</h4>
					<CodeWindow
						title="Terminal"
						code={dockerCode}
						language="bash"
						showLineNumbers={false}
						theme="dark"
						variant="minimal"
					/>
				</div> */}
			</CardContent>
		</Card>
	);
}

function SupportSection() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Need Help?</CardTitle>
				<CardDescription>We're here to help you get started with {siteConfig.name}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 md:grid-cols-3">
					<Link
						href={routes.docs}
						className="flex flex-col items-center text-center p-4 rounded-lg border hover:bg-muted/50 transition-colors"
					>
						<InfoIcon className="h-8 w-8 mb-2 text-primary" />
						<h4 className="font-semibold">Documentation</h4>
						<p className="text-sm text-muted-foreground">Complete guides and API reference</p>
					</Link>

					<Link
						href={routes.contact}
						className="flex flex-col items-center text-center p-4 rounded-lg border hover:bg-muted/50 transition-colors"
					>
						<UserIcon className="h-8 w-8 mb-2 text-primary" />
						<h4 className="font-semibold">Contact Support</h4>
						<p className="text-sm text-muted-foreground">Get help from our support team</p>
					</Link>

					<Link
						href={siteConfig.links.github}
						className="flex flex-col items-center text-center p-4 rounded-lg border hover:bg-muted/50 transition-colors"
					>
						<GitBranchIcon className="h-8 w-8 mb-2 text-primary" />
						<h4 className="font-semibold">GitHub</h4>
						<p className="text-sm text-muted-foreground">Report issues and contribute</p>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
