import { env } from "@/env";
import { getPayloadClient } from "@/lib/payload/payload";
import type { VercelDeployment } from "@/payload-types"; // Assuming payload-types are generated

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

/**
 * Saves Vercel deployment information to the Payload CMS database.
 * Checks for existing deployment ID to prevent duplicates.
 * @param deploymentInfo - The deployment details extracted from Vercel redirect.
 * @returns Promise<VercelDeployment | null> - The created deployment record or null if failed/skipped.
 */
export async function saveVercelDeployment(deploymentInfo: DeploymentInfo) {
	if (!env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED) {
		console.warn("Payload not enabled, skipping Vercel deployment save.");
		return null;
	}

	if (!deploymentInfo.deploymentId || !deploymentInfo.projectId) {
		console.error(
			"Missing required deployment information (deploymentId or projectId), cannot save Vercel deployment info."
		);
		return null;
	}

	try {
		const payload = await getPayloadClient();
		if (!payload) {
			console.error("Failed to get Payload client, cannot save Vercel deployment info.");
			return null;
		}

		// Check if a deployment with this ID already exists
		const existing = await payload.find({
			collection: "vercel-deployments",
			where: {
				deploymentId: {
					equals: deploymentInfo.deploymentId,
				},
			},
			limit: 1,
		});

		if (existing.docs.length > 0) {
			return existing.docs[0]; // Return the existing one
		}

		// Create new deployment record
		const newDeployment = await payload.create({
			collection: "vercel-deployments",
			data: {
				teamId: deploymentInfo.teamId,
				projectId: deploymentInfo.projectId,
				deploymentId: deploymentInfo.deploymentId,
				deploymentDashboardUrl: deploymentInfo.deploymentDashboardUrl,
				deploymentUrl: deploymentInfo.deploymentUrl,
				productionDeployHookUrl: deploymentInfo.productionDeployHookUrl,
				projectDashboardUrl: deploymentInfo.projectDashboardUrl,
				projectName: deploymentInfo.projectName,
				repositoryUrl: deploymentInfo.repositoryUrl,
			},
		});

		return newDeployment;
	} catch (error) {
		console.error("Error saving Vercel deployment info:", error);
		return null;
	}
}
