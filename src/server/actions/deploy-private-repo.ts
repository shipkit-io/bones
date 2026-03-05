"use server";

/**
 * @fileoverview Server actions for private repository deployment (mutations only)
 * NOTE: For read operations like checking availability, use the service directly:
 * import { deploymentService } from "@/server/services/deployment-service"
 */

import { generateProjectNameSuggestions } from "@/lib/utils";
import { auth } from "@/server/auth";
import {
	deploymentService,
	type DeploymentConfig as ServiceDeploymentConfig,
	type DeploymentResult,
} from "@/server/services/deployment-service";

// Re-export from utils for backwards compatibility
export { generateProjectNameSuggestions };

// Types for backwards compatibility
type EnvVarTarget = readonly ("production" | "preview" | "development")[];

export interface DeploymentConfig {
	templateRepo: string;
	projectName: string;
	newRepoName?: string; // Deprecated - use projectName
	description?: string;
	environmentVariables?: {
		key: string;
		value: string;
		target: EnvVarTarget;
	}[];
	domains?: string[];
	includeAllBranches?: boolean;
	githubToken?: string;
	deploymentId?: string;
	userId?: string;
}

/**
 * Deploy a private repository template to user's GitHub and Vercel accounts
 */
export async function deployPrivateRepository(config: DeploymentConfig): Promise<DeploymentResult> {
	// Get userId from config or auth
	let userId = config.userId;

	if (!userId) {
		const session = await auth();
		if (!session?.user?.id) {
			return {
				success: false,
				error: "Authentication required. Please log in to continue.",
			};
		}
		userId = session.user.id;
	}

	// Map old config format to new service format
	const serviceConfig: ServiceDeploymentConfig = {
		templateRepo: config.templateRepo,
		projectName: config.projectName || config.newRepoName || "",
		description: config.description,
		environmentVariables: config.environmentVariables,
		domains: config.domains,
		includeAllBranches: config.includeAllBranches,
		githubToken: config.githubToken,
		deploymentId: config.deploymentId,
		userId,
	};

	return deploymentService.deployPrivateRepository(serviceConfig);
}
