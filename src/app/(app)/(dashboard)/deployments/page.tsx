import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardVercelDeploy } from "@/components/modules/deploy/dashboard-vercel-deploy";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";
import { createRedirectUrl } from "@/lib/utils/redirect";
import { auth } from "@/server/auth";
import type { Deployment } from "@/server/db/schema";
import { deploymentService } from "@/server/services/deployment-service";
import { DeploymentsList } from "./deployments-list";

export const metadata: Metadata = constructMetadata({
	title: "Deployments",
	description:
		"Manage and monitor your application deployments. View deployment status, logs, and history.",
});

// Opt out of caching - deployments have many states and update frequently
// React Query handles polling via /api/deployments for real-time updates
export const dynamic = "force-dynamic";

export default async function DeploymentsPage() {
	const session = await auth({ protect: true });

	// Defensive check: even with protect: true, ensure user exists
	if (!session?.user?.id) {
		redirect(
			createRedirectUrl(routes.auth.signIn, { nextUrl: routes.app.dashboard }),
		);
	}

	let deployments: Deployment[] = [];

	try {
		deployments = await deploymentService.getUserDeployments(session.user.id);

		// Initialize demo data if no deployments exist
		if (process.env.NODE_ENV === "development" && deployments.length === 0) {
			await deploymentService.initializeDemoDeployments(session.user.id);
			deployments = await deploymentService.getUserDeployments(session.user.id);
		}
	} catch (error) {
		console.error("Failed to load deployments:", error);
	}

	// Check if there's an active deployment (status = "deploying")
	const hasActiveDeployment = deployments.some(
		(deployment) => deployment.status === "deploying"
	);

	return (
		<div className="container mx-auto py-10 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Deployments</h1>
					<p className="text-muted-foreground mt-2">
						Manage and monitor your Shipkit deployments to Vercel
					</p>
				</div>
				<DashboardVercelDeploy hasActiveDeployment={hasActiveDeployment} />
			</div>
			<DeploymentsList deployments={deployments} />
		</div>
	);
}
