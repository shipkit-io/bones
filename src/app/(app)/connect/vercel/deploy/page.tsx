import type { Metadata } from "next";
import { ArrowUpRight, CheckCircle } from "lucide-react";
import { Link } from "@/components/primitives/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { ConfettiSideCannons } from "@/components/ui/magicui/confetti/confetti-side-cannons";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { saveVercelDeployment } from "@/server/services/vercel";

export const metadata: Metadata = constructMetadata({
	title: "Deployment Successful",
	description: "Your project has been successfully deployed to Vercel.",
	noIndex: true,
});

interface DeploymentInfo {
	teamId: string | undefined;
	projectId: string | undefined;
	deploymentId: string | undefined;
	deploymentDashboardUrl: string;
	deploymentUrl: string;
	productionDeployHookUrl: string;
	projectDashboardUrl: string;
	projectName: string;
	repositoryUrl: string;
}

function extractDeploymentInfo(
	searchParams: Record<string, string | string[] | undefined>
): DeploymentInfo {
	const teamId = typeof searchParams.teamId === "string" ? searchParams.teamId : undefined;
	const projectId = typeof searchParams.projectId === "string" ? searchParams.projectId : undefined;
	const deploymentId =
		typeof searchParams.deploymentId === "string" ? searchParams.deploymentId : undefined;

	function decodeParam(param: string | string[] | undefined): string {
		if (typeof param === "string") {
			return decodeURIComponent(param);
		}
		return "";
	}

	return {
		teamId,
		projectId,
		deploymentId,
		deploymentDashboardUrl: decodeParam(searchParams["deployment-dashboard-url"]),
		deploymentUrl: decodeParam(searchParams["deployment-url"]),
		productionDeployHookUrl: decodeParam(searchParams["production-deploy-hook-url"]),
		projectDashboardUrl: decodeParam(searchParams["project-dashboard-url"]),
		projectName: decodeParam(searchParams["project-name"]),
		repositoryUrl: decodeParam(searchParams["repository-url"]),
	};
}

export default async function VercelDeployPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const deploymentInfo = extractDeploymentInfo(params);

	// Attempt to save deployment info to the database
	await saveVercelDeployment(deploymentInfo);

	return (
		<>
			<ConfettiSideCannons />
			<div className="container max-w-2xl mx-auto py-10">
				<Card>
					<CardHeader className="text-center">
						<div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
							<CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
						</div>
						<CardTitle className="text-2xl">Deployment Successful!</CardTitle>
						<CardDescription>
							Your project {deploymentInfo.projectName} has been successfully deployed to Vercel
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<h3 className="text-sm font-medium">Deployment URLs</h3>
							<div className="grid gap-2">
								<Link href={deploymentInfo.deploymentUrl} className="text-sm underline">
									View Live Site →
								</Link>
								<Link href={deploymentInfo.deploymentDashboardUrl} className="text-sm underline">
									View Deployment on Vercel →
								</Link>
							</div>
						</div>

						<div className="space-y-2">
							<h3 className="text-sm font-medium">Project Information</h3>
							<div className="grid gap-2">
								<Link href={deploymentInfo.projectDashboardUrl} className="text-sm underline">
									View Project on Vercel →
								</Link>
								<Link href={deploymentInfo.repositoryUrl} className="text-sm underline">
									GitHub Repository →
								</Link>
								<div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
									<code className="text-sm flex-grow overflow-x-auto">
										git clone {deploymentInfo.repositoryUrl}
									</code>
									<CopyButton
										value={`git clone ${deploymentInfo.repositoryUrl}`}
										successTitle="Command copied!"
										className="h-6 w-6"
									/>
								</div>
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex justify-center gap-4">
						<Link
							className={buttonVariants({ variant: "default" })}
							href={deploymentInfo.deploymentUrl}
						>
							Visit Site <ArrowUpRight className="w-4 h-4" />
						</Link>
						<Button asChild variant="outline">
							<Link href={routes.app.dashboard}>Shipkit Dashboard</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		</>
	);
}
