"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { validateProjectName } from "@/lib/schemas/deployment";
import { auth } from "@/server/auth";
import { type Deployment } from "@/server/db/schema";
import { deploymentService, type DeploymentResult } from "@/server/services/deployment-service";

/**
 * Server Actions for Deployments
 *
 * These are thin wrappers around the deployment service that handle:
 * - Authentication
 * - Input validation
 * - Cache revalidation
 * - Error formatting for the client
 */

/**
 * Initiates a deployment process by creating a deployment record and
 * then calling the main deployment action.
 */
export async function initiateDeployment(formData: FormData): Promise<DeploymentResult> {
	const session = await auth();
	if (!session?.user?.id) {
		return {
			success: false,
			error: "Authentication required. Please log in to continue.",
		};
	}

	const projectName = formData.get("projectName") as string;

	// Validate project name
	const validation = validateProjectName(projectName);
	if (!validation.isValid) {
		return { success: false, error: validation.error };
	}

	const sanitizedProjectName = projectName.trim();
	const userId = session.user.id;

	// Pre-check repository name availability
	try {
		const availability = await deploymentService.checkRepositoryNameAvailable(userId, sanitizedProjectName);
		if (availability.checked && !availability.available) {
			return {
				success: false,
				error: `A repository named "${sanitizedProjectName}" already exists on your GitHub account. Please choose a different project name.`,
			};
		}
	} catch (preCheckError) {
		console.warn("Pre-check for repository name failed, continuing:", preCheckError);
	}

	try {
		// Create deployment record
		const newDeployment = await deploymentService.createDeployment(userId, {
			projectName: sanitizedProjectName,
			description: `Deployment of ${sanitizedProjectName}`,
			status: "deploying",
		});

		revalidatePath(routes.app.deployments);

		// Trigger deployment in background
		void (async () => {
			try {
				await deploymentService.deployPrivateRepository({
					templateRepo: deploymentService.getDefaultTemplateRepo(),
					projectName: sanitizedProjectName,
					description: `Deployment of ${sanitizedProjectName}`,
					deploymentId: newDeployment.id,
					userId,
				});
			} catch (error) {
				console.error(`Deployment failed for ${sanitizedProjectName}:`, error);
				try {
					await deploymentService.updateDeployment(newDeployment.id, userId, {
						status: "failed",
						error: error instanceof Error ? error.message : "An unknown error occurred",
					});
				} catch (updateError) {
					console.error(`Failed to update deployment status:`, updateError);
				}
			}
		})();

		return {
			success: true,
			message: "Deployment started! Monitor progress below - you'll be notified when it completes or if any errors occur.",
			deploymentId: newDeployment.id,
			data: { githubRepo: undefined, vercelProject: undefined },
		};
	} catch (error) {
		console.error(`Failed to create deployment record for ${sanitizedProjectName}:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to create deployment record",
		};
	}
}

/**
 * Create a new deployment record
 */
export async function createDeployment(
	data: Parameters<typeof deploymentService.createDeployment>[1]
): Promise<Deployment> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	const result = await deploymentService.createDeployment(session.user.id, data);
	revalidatePath(routes.app.deployments);
	return result;
}

/**
 * Update an existing deployment
 */
export async function updateDeployment(
	id: string,
	data: Parameters<typeof deploymentService.updateDeployment>[2],
	userId?: string
): Promise<Deployment | null> {
	// Use provided userId (for background tasks) or get from auth
	let effectiveUserId = userId;

	if (!effectiveUserId) {
		const session = await auth();
		if (!session?.user?.id) {
			throw new Error("Unauthorized");
		}
		effectiveUserId = session.user.id;
	}

	const result = await deploymentService.updateDeployment(id, effectiveUserId, data);

	// Only revalidate when called from a request context (not from background tasks)
	if (result && !userId) {
		revalidatePath(routes.app.deployments);
	}

	return result;
}

/**
 * Delete a deployment record
 */
export async function deleteDeployment(id: string): Promise<boolean> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	const result = await deploymentService.deleteDeployment(id, session.user.id);
	revalidatePath(routes.app.deployments);
	return result;
}

/**
 * Cancel a deployment that is stuck in "deploying" state
 */
export async function cancelDeployment(id: string): Promise<Deployment | null> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	const result = await deploymentService.cancelDeployment(id, session.user.id);
	if (result) {
		revalidatePath(routes.app.deployments);
	}
	return result;
}

