"use client";

import { AlertCircle, CheckCircle, Clock, ExternalLink, Github } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link as LinkWithTransition } from "@/components/primitives/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";
import { deployPrivateRepository } from "@/server/actions/deploy-private-repo";

interface DeploymentStatus {
	step:
		| "idle"
		| "validating"
		| "creating-repo"
		| "creating-vercel"
		| "deploying"
		| "completed"
		| "error";
	message?: string;
	githubRepo?: {
		url: string;
		name: string;
	};
	vercelProject?: {
		projectUrl: string;
		deploymentUrl?: string;
	};
	error?: string;
}

// Get Shipkit repository from site config
const SHIPKIT_REPO = `${siteConfig.repo.owner}/${siteConfig.repo.name}`;

export const PrivateRepoDeployButton = () => {
	const [formData, setFormData] = useState({
		projectName: "",
		description: "",
	});
	const [status, setStatus] = useState<DeploymentStatus>({ step: "idle" });
	const [isDeploying, setIsDeploying] = useState(false);
	const [needsGitHubAuth, setNeedsGitHubAuth] = useState(false);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !isDeploying) {
			e.preventDefault();
			handleDeploy();
		}
	};

	const handleDeploy = async () => {
		if (!formData.projectName) {
			toast.error("Please enter a project name");
			return;
		}

		setIsDeploying(true);
		setStatus({ step: "validating", message: "Validating configuration..." });

		try {
			const result = await deployPrivateRepository({
				templateRepo: SHIPKIT_REPO,
				projectName: formData.projectName,
				description: formData.description || `Deployed from ${SHIPKIT_REPO}`,
			});

			if (result.success && result.data) {
				setStatus({
					step: "completed",
					message: result.message,
					githubRepo: result.data.githubRepo,
					vercelProject: result.data.vercelProject,
				});
				toast.success("Deployment completed successfully!");
			} else {
				// Check if the error is related to GitHub authentication
				if (result.error?.includes("GitHub account not connected")) {
					setNeedsGitHubAuth(true);
				}
				setStatus({
					step: "error",
					error: result.error || "Deployment failed",
					githubRepo: result.data?.githubRepo, // Keep the GitHub repo info if available
				});

				// If manual import is required and we have a GitHub repo, open Vercel import
				if (result.data?.requiresManualImport && result.data?.githubRepo?.url) {
					toast.info("Opening Vercel import page...");
					const importUrl = `https://vercel.com/new/import?s=${encodeURIComponent(
						result.data.githubRepo.url
					)}`;
					window.open(importUrl, "_blank", "noopener,noreferrer");
				} else {
					toast.error(result.error || "Deployment failed");
				}
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
			setStatus({
				step: "error",
				error: errorMessage,
			});
			toast.error(errorMessage);
		} finally {
			setIsDeploying(false);
		}
	};

	const resetForm = () => {
		setStatus({ step: "idle" });
		setFormData({
			projectName: "",
			description: "",
		});
		setNeedsGitHubAuth(false);
	};

	const getStatusIcon = () => {
		switch (status.step) {
			case "completed":
				return <CheckCircle className="h-5 w-5 text-green-500" />;
			case "error":
				return <AlertCircle className="h-5 w-5 text-red-500" />;
			case "idle":
				return null;
			default:
				return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
		}
	};

	const getStatusBadgeVariant = () => {
		switch (status.step) {
			case "completed":
				return "default" as const;
			case "error":
				return "destructive" as const;
			case "idle":
				return "secondary" as const;
			default:
				return "outline" as const;
		}
	};

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Github className="h-5 w-5" />
					Deploy Shipkit
				</CardTitle>
				<CardDescription>
					Deploy your own instance of Shipkit to GitHub and Vercel. Make sure you have connected
					both your GitHub and Vercel accounts in Settings first.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Status Display */}
				{status.step !== "idle" && (
					<Alert>
						<div className="flex items-center gap-2">
							{getStatusIcon()}
							<Badge variant={getStatusBadgeVariant()}>
								{status.step.replace("-", " ").toUpperCase()}
							</Badge>
						</div>
						<AlertDescription className="mt-2">
							{status.message || status.error}
							{needsGitHubAuth && (
								<div className="mt-3">
									<LinkWithTransition
										href={routes.settings.account}
										className={cn(
											buttonVariants({ variant: "default", size: "sm" }),
											"inline-flex items-center gap-2"
										)}
									>
										<Github className="h-4 w-4" />
										Connect GitHub Account
									</LinkWithTransition>
								</div>
							)}
							{status.step === "error" && status.githubRepo && (
								<div className="mt-3 space-y-2">
									<p className="text-sm">
										✅ GitHub repository created:{" "}
										<span className="font-mono text-xs">{status.githubRepo?.name}</span>
									</p>
									<p className="text-sm">
										The Vercel import page should have opened in a new tab. If it didn't, click
										below:
									</p>
									<Button
										variant="default"
										size="sm"
										onClick={() => {
											const importUrl = `https://vercel.com/new/import?s=${encodeURIComponent(
												status.githubRepo?.url || ""
											)}`;
											window.open(importUrl, "_blank", "noopener,noreferrer");
										}}
										className="inline-flex items-center gap-2"
									>
										<ExternalLink className="h-4 w-4" />
										Open Vercel Import
									</Button>
								</div>
							)}
						</AlertDescription>
					</Alert>
				)}

				{/* Success Results */}
				{status.step === "completed" && status.githubRepo && status.vercelProject && (
					<div className="space-y-4">
						<Separator />
						<div className="grid gap-4 md:grid-cols-2">
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-medium">GitHub Repository</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted-foreground">{status.githubRepo.name}</span>
										<Button variant="ghost" size="sm" asChild>
											<a
												href={status.githubRepo.url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1"
											>
												<ExternalLink className="h-3 w-3" />
												View
											</a>
										</Button>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm font-medium">Vercel Project</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted-foreground">Dashboard</span>
										<Button variant="ghost" size="sm" asChild>
											<a
												href={status.vercelProject.projectUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1"
											>
												<ExternalLink className="h-3 w-3" />
												View
											</a>
										</Button>
									</div>
									{status.vercelProject.deploymentUrl && (
										<div className="flex items-center justify-between mt-2">
											<span className="text-sm text-muted-foreground">Live Site</span>
											<Button variant="ghost" size="sm" asChild>
												<a
													href={status.vercelProject.deploymentUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-1"
												>
													<ExternalLink className="h-3 w-3" />
													Visit
												</a>
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
						<Button onClick={resetForm} variant="outline" className="w-full">
							Deploy Another Instance
						</Button>
					</div>
				)}

				{/* Form - Show on idle or error states */}
				{(status.step === "idle" || status.step === "error") && (
					<div className="space-y-4">
						<Alert>
							<Github className="h-4 w-4" />
							<AlertDescription>
								This will create a copy of the Shipkit repository ({SHIPKIT_REPO}) in your GitHub
								account and deploy it to Vercel.
							</AlertDescription>
						</Alert>

						<div className="space-y-2">
							<Label htmlFor="projectName">Project Name *</Label>
							<Input
								id="projectName"
								placeholder="my-shipkit-instance"
								value={formData.projectName}
								onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
								onKeyDown={handleKeyDown}
							/>
							<p className="text-xs text-muted-foreground">
								Name for your Shipkit instance (lowercase, numbers, hyphens only)
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Input
								id="description"
								placeholder="My custom Shipkit deployment"
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								onKeyDown={handleKeyDown}
							/>
						</div>

						<div className="pt-4 space-y-3">
							<Button onClick={handleDeploy} disabled={isDeploying} className="w-full">
								{isDeploying ? "Deploying..." : "Deploy Shipkit"}
							</Button>
							<p className="text-xs text-center text-muted-foreground">
								Make sure you've connected your GitHub and Vercel accounts in{" "}
								<LinkWithTransition
									href={routes.settings.account}
									className="text-primary hover:underline"
								>
									Settings
								</LinkWithTransition>{" "}
								first.
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
