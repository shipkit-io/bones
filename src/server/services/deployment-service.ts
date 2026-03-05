import { and, desc, eq } from "drizzle-orm";
import { siteConfig } from "@/config/site-config";
import { createGitHubTemplateService } from "@/lib/github-template";
import { logger } from "@/lib/logger";
import { createVercelAPIService, type VercelAPIService } from "@/lib/vercel-api";
import { db } from "@/server/db";
import { type Deployment, deployments, type NewDeployment } from "@/server/db/schema";
import { getGitHubAccessToken } from "@/server/services/github/github-token-service";
import { rateLimitService, rateLimits } from "@/server/services/rate-limit-service";
import { getVercelAccessToken } from "@/server/services/vercel/vercel-service";

// Constants
const SHIPKIT_REPO = `${siteConfig.repo.owner}/${siteConfig.repo.name}`;
const POLLING_INTERVAL_MS = 10000; // 10 seconds
const MAX_DEPLOYMENT_POLL_ATTEMPTS = 18; // Poll for up to ~3 minutes

// Types
export interface DeploymentConfig {
	templateRepo: string;
	projectName: string;
	description?: string;
	environmentVariables?: {
		key: string;
		value: string;
		target: readonly ("production" | "preview" | "development")[];
	}[];
	domains?: string[];
	includeAllBranches?: boolean;
	githubToken?: string;
	deploymentId?: string;
	userId: string;
}

export interface DeploymentResult {
	success: boolean;
	message?: string;
	error?: string;
	deploymentId?: string;
	data?: {
		githubRepo?: {
			url: string;
			name: string;
			cloneUrl: string;
		};
		vercelProject?: {
			projectId: string;
			projectUrl: string;
			deploymentId?: string;
			deploymentUrl?: string;
		};
		step?: string;
		details?: unknown;
		requiresManualImport?: boolean;
		isPendingInvitation?: boolean;
		invitationUrl?: string;
	};
}

interface TokenValidationResult {
	valid: boolean;
	scopes?: string[];
	missingScopes?: string[];
}

export function resolveDeploymentStatusFromVercelState(state?: string): {
	status: "deploying" | "completed" | "failed";
	isTerminal: boolean;
	error?: string;
} {
	if (!state) {
		return { status: "deploying", isTerminal: false };
	}

	const normalizedState = state.toUpperCase();
	if (normalizedState === "READY") {
		return { status: "completed", isTerminal: true };
	}
	if (normalizedState === "ERROR") {
		return {
			status: "failed",
			isTerminal: true,
			error: "Vercel deployment failed",
		};
	}
	if (normalizedState === "CANCELED") {
		return {
			status: "failed",
			isTerminal: true,
			error: "Vercel deployment was canceled",
		};
	}
	return { status: "deploying", isTerminal: false };
}

/**
 * Deployment Service
 *
 * Handles all deployment-related business logic including:
 * - Deployment CRUD operations
 * - GitHub repository creation from templates
 * - Vercel project creation and deployment triggering
 * - Deployment status polling
 */
class DeploymentService {
	/**
	 * Get the default template repository
	 */
	getDefaultTemplateRepo(): string {
		return SHIPKIT_REPO;
	}

	// =============================================================================
	// Deployment CRUD Operations
	// =============================================================================

	/**
	 * Create a new deployment record
	 */
	async createDeployment(
		userId: string,
		data: Omit<NewDeployment, "id" | "userId" | "createdAt" | "updatedAt">
	): Promise<Deployment> {
		if (!db) {
			throw new Error("Database not available");
		}

		const result = await db.transaction(async (tx) => {
			const [newDeployment] = await tx
				.insert(deployments)
				.values({
					...data,
					userId,
				})
				.returning();

			return newDeployment;
		});

		if (!result) {
			throw new Error("Failed to create deployment: no result returned");
		}

		return result;
	}

	/**
	 * Get all deployments for a user
	 */
	async getUserDeployments(userId: string): Promise<Deployment[]> {
		if (!db) {
			throw new Error("Database not available");
		}

		// Refresh deployment statuses from Vercel before returning results.
		await this.syncDeploymentStatuses(userId);

		const userDeployments = await db
			.select()
			.from(deployments)
			.where(eq(deployments.userId, userId))
			.orderBy(desc(deployments.createdAt));

		return userDeployments;
	}

	/**
	 * Update an existing deployment
	 */
	async updateDeployment(
		deploymentId: string,
		userId: string,
		data: Partial<Omit<Deployment, "id" | "userId" | "createdAt">>
	): Promise<Deployment | null> {
		if (!db) {
			throw new Error("Database not available");
		}

		const [updatedDeployment] = await db
			.update(deployments)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(and(eq(deployments.id, deploymentId), eq(deployments.userId, userId)))
			.returning();

		return updatedDeployment || null;
	}

	/**
	 * Delete a deployment record
	 */
	async deleteDeployment(deploymentId: string, userId: string): Promise<boolean> {
		if (!db) {
			throw new Error("Database not available");
		}

		await db
			.delete(deployments)
			.where(and(eq(deployments.id, deploymentId), eq(deployments.userId, userId)));

		return true;
	}

	/**
	 * Cancel a deployment that is stuck in "deploying" state
	 */
	async cancelDeployment(deploymentId: string, userId: string): Promise<Deployment | null> {
		if (!db) {
			throw new Error("Database not available");
		}

		// Only allow canceling deployments that are in "deploying" state
		const [existingDeployment] = await db
			.select()
			.from(deployments)
			.where(and(eq(deployments.id, deploymentId), eq(deployments.userId, userId)))
			.limit(1);

		if (!existingDeployment) {
			throw new Error("Deployment not found");
		}

		if (existingDeployment.status !== "deploying") {
			throw new Error("Can only cancel deployments that are in progress");
		}

		const [canceledDeployment] = await db
			.update(deployments)
			.set({
				status: "failed",
				error: "Deployment was canceled by user",
				updatedAt: new Date(),
			})
			.where(and(eq(deployments.id, deploymentId), eq(deployments.userId, userId)))
			.returning();

		return canceledDeployment || null;
	}

	/**
	 * Refresh deployments that are still deploying by checking Vercel directly.
	 */
	private async syncDeploymentStatuses(userId: string): Promise<void> {
		if (!db) return;

		const vercelToken = await getVercelAccessToken(userId);
		if (!vercelToken) {
			logger.debug("No Vercel token available for sync", { userId });
			return;
		}

		const deploymentsToSync = await db
			.select()
			.from(deployments)
			.where(
				and(
					eq(deployments.userId, userId),
					eq(deployments.status, "deploying")
				)
			);

		if (!deploymentsToSync.length) {
			return;
		}

		logger.debug("Syncing deployment statuses", {
			userId,
			count: deploymentsToSync.length,
		});

		const vercelService = createVercelAPIService(vercelToken);

		for (const deployment of deploymentsToSync) {
			const projectIdentifier =
				deployment.vercelProjectId || deployment.projectName;

			if (!projectIdentifier) {
				logger.warn("Deployment has no project identifier for sync", {
					deploymentId: deployment.id,
				});
				continue;
			}

			try {
				// First try to get project info which may include latestDeployments
				const projectInfo = await vercelService.getProject(projectIdentifier);
				let latestDeployment = projectInfo.data?.latestDeployments?.[0];
				const projectId = projectInfo.data?.id;

				// If latestDeployments is not in the project response, fetch deployments explicitly
				// The Vercel API doesn't always include latestDeployments in the project endpoint
				if (!latestDeployment && projectId) {
					const vercelDeployments = await vercelService.getDeployments(projectId, 1);
					if (vercelDeployments.length > 0) {
						latestDeployment = vercelDeployments[0];
					}
				}

				if (!latestDeployment) {
					logger.debug("No Vercel deployment found for project", {
						deploymentId: deployment.id,
						projectIdentifier,
						projectSuccess: projectInfo.success,
					});
					continue;
				}

				// Handle both 'state' and 'readyState' fields from Vercel API
				const deploymentState = latestDeployment.state || latestDeployment.readyState;

				if (!deploymentState) {
					logger.debug("Vercel deployment has no state", {
						deploymentId: deployment.id,
						projectIdentifier,
						latestDeployment,
					});
					continue;
				}

				const resolvedStatus = resolveDeploymentStatusFromVercelState(deploymentState);

				logger.debug("Resolved Vercel deployment status", {
					deploymentId: deployment.id,
					vercelState: deploymentState,
					resolvedStatus: resolvedStatus.status,
					isTerminal: resolvedStatus.isTerminal,
				});

				if (resolvedStatus.isTerminal) {
					const deploymentUrl = latestDeployment.url
						? `https://${latestDeployment.url}`
						: deployment.vercelDeploymentUrl;
					await this.updateDeployment(deployment.id, userId, {
						status: resolvedStatus.status,
						vercelDeploymentId: latestDeployment.uid ?? latestDeployment.id ?? deployment.vercelDeploymentId,
						vercelDeploymentUrl: deploymentUrl,
						error: resolvedStatus.error,
					});
					logger.info("Updated deployment status from Vercel", {
						deploymentId: deployment.id,
						projectName: deployment.projectName,
						newStatus: resolvedStatus.status,
					});
				}
			} catch (error) {
				logger.warn("Failed to sync deployment status from Vercel", {
					deploymentId: deployment.id,
					projectIdentifier,
					error,
				});
			}
		}
	}

	// =============================================================================
	// Core Deployment Orchestration
	// =============================================================================

	/**
	 * Deploy a private repository template to user's GitHub and Vercel accounts
	 */
	async deployPrivateRepository(config: DeploymentConfig): Promise<DeploymentResult> {
		const { userId, templateRepo, projectName, description, environmentVariables = [] } = config;

		// Apply rate limiting
		try {
			await rateLimitService.checkLimit(userId, "deployment:create", rateLimits.deployments.create);
		} catch (error) {
			logger.warn("Rate limit exceeded for deployment", { userId, error });
			return {
				success: false,
				error: "Too many deployment attempts. Please wait before trying again.",
			};
		}

		// Get tokens
		const githubToken = await this.getGitHubToken(userId, config.githubToken);
		if (!githubToken) {
			return {
				success: false,
				error: "GitHub account not connected. Please connect your GitHub account first or provide an access token.",
			};
		}

		const tokenValidation = await this.validateGitHubTokenScopes(githubToken);
		if (!tokenValidation.valid) {
			return {
				success: false,
				error: `GitHub token missing required permissions: ${tokenValidation.missingScopes?.join(", ")}. Please ensure your token has 'repo' and 'workflow' scopes.`,
			};
		}

		const vercelToken = await getVercelAccessToken(userId);
		if (!vercelToken) {
			return {
				success: false,
				error: "Vercel account not connected. Please connect your Vercel account in Settings first.",
			};
		}

		let currentDeploymentId = config.deploymentId;

		try {
			// Create deployment record if not provided
			if (!currentDeploymentId) {
				const newDeployment = await this.createDeployment(userId, {
					projectName,
					description: description || `Deployment of ${projectName}`,
					status: "deploying",
				});
				currentDeploymentId = newDeployment.id;
			}

			// Validate configuration
			const validation = this.validateDeploymentConfig({
				templateRepo,
				projectName,
				vercelToken,
			});

			if (!validation.success) {
				await this.updateDeployment(currentDeploymentId, userId, {
					status: "failed",
					error: validation.error,
				});
				return { success: false, error: validation.error };
			}

			// Parse template repo
			const [templateOwner, templateRepoName] = templateRepo.split("/");
			if (!templateOwner || !templateRepoName) {
				const error = "Template repository must be in format 'owner/repo-name'";
				await this.updateDeployment(currentDeploymentId, userId, { status: "failed", error });
				return { success: false, error };
			}

			// Initialize services
			const githubService = createGitHubTemplateService(githubToken);
			const vercelService = createVercelAPIService(vercelToken);

			// Step 1: Get GitHub username
			const userInfo = await githubService.getCurrentUserInfo();
			if (!userInfo.success || !userInfo.username) {
				const error = userInfo.error || "Failed to get GitHub user information.";
				await this.updateDeployment(currentDeploymentId, userId, { status: "failed", error });
				return { success: false, error };
			}

			const githubUsername = userInfo.username;

			// Step 2: Check repository name availability
			const isAvailable = await githubService.isRepositoryNameAvailable(githubUsername, projectName);
			if (!isAvailable) {
				const error = `A repository named "${projectName}" already exists on your GitHub account.`;
				await this.updateDeployment(currentDeploymentId, userId, { status: "failed", error });
				return { success: false, error, data: { step: "github-name-check" } };
			}

			// Step 3: Create GitHub repository from template
			const repoResult = await githubService.createFromTemplate({
				templateOwner,
				templateRepo: templateRepoName,
				newRepoName: projectName,
				newRepoOwner: githubUsername,
				description: description || `Deployed from ${templateRepo} template`,
				private: false,
			});

			if (!repoResult.success) {
				const error = repoResult.error || "Failed to create GitHub repository";
				await this.updateDeployment(currentDeploymentId, userId, { status: "failed", error });

				if (repoResult.isPendingInvitation) {
					return {
						success: false,
						error: `${error} Visit: ${repoResult.invitationUrl || "https://github.com/notifications"}`,
						data: { step: "github-pending-invitation", isPendingInvitation: true, invitationUrl: repoResult.invitationUrl },
					};
				}

				return { success: false, error, data: { step: "github-repo-creation" } };
			}

			const repoInfo = {
				url: repoResult.repoUrl ?? "",
				name: projectName,
				cloneUrl: repoResult.details?.cloneUrl ?? repoResult.repoUrl ?? "",
			};

			// Update deployment with GitHub info
			await this.updateDeployment(currentDeploymentId, userId, {
				githubRepoUrl: repoInfo.url,
				githubRepoName: repoInfo.name,
			});

			// Step 4: Create Vercel project
			const vercelResult = await this.createVercelProject(
				vercelService,
				projectName,
				githubUsername,
				environmentVariables
			);

			if (!vercelResult.success || !vercelResult.projectId) {
				const error = vercelResult.error ?? "Failed to create Vercel project.";
				await this.updateDeployment(currentDeploymentId, userId, { status: "failed", error });
				return {
					success: false,
					error,
					data: { step: "vercel-project-creation", githubRepo: repoInfo, requiresManualImport: true },
				};
			}

			// Update deployment with Vercel info
			await this.updateDeployment(currentDeploymentId, userId, {
				vercelProjectId: vercelResult.projectId,
				vercelProjectUrl: vercelResult.projectUrl ?? "",
				vercelDeploymentUrl: `https://${projectName}.vercel.app`,
			});

			// Step 5: Trigger initial deployment
			await this.triggerInitialDeployment(
				vercelService,
				vercelResult.projectId,
				projectName,
				currentDeploymentId,
				userId,
				repoResult.repoId
			);

			// Step 6: Start background polling for deployment status
			this.pollDeploymentStatus(
				vercelService,
				vercelResult.projectId,
				projectName,
				currentDeploymentId,
				userId
			);

			return {
				success: true,
				message: `Successfully created project ${projectName} on Vercel. The initial deployment will begin shortly.`,
				data: {
					githubRepo: repoInfo,
					vercelProject: {
						projectId: vercelResult.projectId,
						projectUrl: vercelResult.projectUrl ?? "",
						deploymentUrl: `https://${projectName}.vercel.app`,
					},
				},
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown deployment error";
			logger.error("Deployment failed", { error: errorMessage, projectName, templateRepo });

			const userFriendlyError = this.getUserFriendlyError(errorMessage);

			if (currentDeploymentId) {
				await this.updateDeployment(currentDeploymentId, userId, {
					status: "failed",
					error: userFriendlyError,
				});
			}

			return { success: false, error: userFriendlyError, data: { step: "deployment-error" } };
		}
	}

	// =============================================================================
	// Validation
	// =============================================================================

	/**
	 * Validate deployment configuration before attempting deployment
	 */
	validateDeploymentConfig(config: {
		templateRepo: string;
		projectName: string;
		vercelToken: string;
	}): { success: boolean; error?: string } {
		const { templateRepo, projectName, vercelToken } = config;

		if (!templateRepo?.includes("/")) {
			return { success: false, error: "Template repository must be in format 'owner/repo-name'" };
		}

		if (!projectName || projectName.length < 3) {
			return { success: false, error: "Project name must be at least 3 characters long" };
		}

		if (!/^[a-z0-9-]+$/.test(projectName)) {
			return { success: false, error: "Project name can only contain lowercase letters, numbers, and hyphens" };
		}

		if (!vercelToken) {
			return { success: false, error: "Vercel access token is required" };
		}

		return { success: true };
	}

	/**
	 * Validate GitHub token has required scopes for deployment
	 */
	async validateGitHubTokenScopes(token: string): Promise<TokenValidationResult> {
		const requiredScopes = ["repo", "workflow"];

		try {
			const response = await fetch("https://api.github.com/user", {
				headers: {
					Authorization: `token ${token}`,
					Accept: "application/vnd.github.v3+json",
				},
			});

			if (!response.ok) {
				return { valid: false, missingScopes: requiredScopes };
			}

			const scopesHeader = response.headers.get("x-oauth-scopes");
			const scopes = scopesHeader ? scopesHeader.split(",").map((s) => s.trim()) : [];
			const missingScopes = requiredScopes.filter((required) => !scopes.includes(required));

			return {
				valid: missingScopes.length === 0,
				scopes,
				missingScopes: missingScopes.length > 0 ? missingScopes : undefined,
			};
		} catch (error) {
			logger.error("Failed to validate GitHub token scopes", { error });
			return { valid: true, scopes: [] };
		}
	}

	// =============================================================================
	// GitHub Invitation Handling
	// =============================================================================

	/**
	 * Check if the user has a pending GitHub invitation to the template repository
	 */
	async checkPendingGitHubInvitation(userId: string): Promise<{
		hasPendingInvitation: boolean;
		invitationUrl?: string;
		error?: string;
	}> {
		try {
			const githubToken = await getGitHubAccessToken(userId);
			if (!githubToken) {
				return { hasPendingInvitation: false };
			}

			const githubService = createGitHubTemplateService(githubToken);
			const result = await githubService.checkPendingInvitation(
				siteConfig.repo.owner,
				siteConfig.repo.name
			);

			return {
				hasPendingInvitation: result.hasPendingInvitation,
				invitationUrl: result.invitationUrl,
			};
		} catch (error) {
			logger.warn("Failed to check pending GitHub invitation", { error, userId });
			return { hasPendingInvitation: false };
		}
	}

	/**
	 * Check if a repository name is available on the user's GitHub account
	 */
	async checkRepositoryNameAvailable(
		userId: string,
		projectName: string
	): Promise<{ available: boolean; error?: string; checked: boolean; reason?: string }> {
		try {
			const githubToken = await getGitHubAccessToken(userId);
			if (!githubToken) {
				return { available: true, checked: false, reason: "no_github_connection" };
			}

			const githubService = createGitHubTemplateService(githubToken);
			const userInfo = await githubService.getCurrentUserInfo();
			if (!userInfo.success || !userInfo.username) {
				return { available: true, checked: false, reason: "github_api_error" };
			}

			const isAvailable = await githubService.isRepositoryNameAvailable(userInfo.username, projectName);

			if (!isAvailable) {
				return {
					available: false,
					error: `A repository named "${projectName}" already exists on your GitHub account`,
					checked: true,
				};
			}

			return { available: true, checked: true };
		} catch (error) {
			logger.warn("Failed to check repository name availability", { error, userId, projectName });
			return { available: true, checked: false };
		}
	}

	// =============================================================================
	// Demo Data
	// =============================================================================

	/**
	 * Initialize demo deployments for new users
	 */
	async initializeDemoDeployments(userId: string): Promise<void> {
		if (!db) {
			throw new Error("Database not available");
		}

		// Check if user already has deployments
		const existingDeployments = await db
			.select()
			.from(deployments)
			.where(eq(deployments.userId, userId))
			.limit(1);

		if (existingDeployments.length > 0) {
			return;
		}

		const demoDeployments: Omit<NewDeployment, "id" | "createdAt" | "updatedAt">[] = [
			{
				userId,
				projectName: "my-shipkit-app",
				description: "Production deployment",
				githubRepoUrl: "https://github.com/demo/my-shipkit-app",
				githubRepoName: "demo/my-shipkit-app",
				vercelProjectUrl: "https://vercel.com/demo/my-shipkit-app",
				vercelDeploymentUrl: "https://my-shipkit-app.vercel.app",
				status: "completed",
			},
			{
				userId,
				projectName: "shipkit-staging",
				description: "Staging environment",
				githubRepoUrl: "https://github.com/demo/shipkit-staging",
				githubRepoName: "demo/shipkit-staging",
				vercelProjectUrl: "https://vercel.com/demo/shipkit-staging",
				vercelDeploymentUrl: "https://shipkit-staging.vercel.app",
				status: "completed",
			},
			{
				userId,
				projectName: "shipkit-dev",
				description: "Development environment",
				status: "failed",
				error: "Build failed: Module not found",
			},
		];

		await db.insert(deployments).values(demoDeployments);
	}

	// =============================================================================
	// Private Helpers
	// =============================================================================

	/**
	 * Get GitHub token (OAuth or provided)
	 */
	private async getGitHubToken(userId: string, providedToken?: string): Promise<string | null> {
		let githubToken = await getGitHubAccessToken(userId);

		if (!githubToken && providedToken) {
			const tokenRegex = /^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})$/;
			if (tokenRegex.test(providedToken)) {
				githubToken = providedToken;
			}
		}

		return githubToken;
	}

	/**
	 * Create Vercel project with retry logic
	 */
	private async createVercelProject(
		vercelService: VercelAPIService,
		projectName: string,
		githubUsername: string,
		environmentVariables: DeploymentConfig["environmentVariables"]
	): Promise<{ success: boolean; projectId?: string; projectUrl?: string; error?: string }> {
		// First try with git repository
		let projectResult = await vercelService.createProject({
			name: projectName,
			gitRepository: {
				type: "github" as const,
				repo: `${githubUsername}/${projectName}`,
			},
			framework: "nextjs",
			environmentVariables: environmentVariables?.length ? environmentVariables : undefined,
		});

		if (!projectResult.success) {
			// Try without git repository
			projectResult = await vercelService.createProject({
				name: projectName,
				framework: "nextjs",
				environmentVariables: environmentVariables?.length ? environmentVariables : undefined,
			});

			// If successful, try to connect the repository
			if (projectResult.success && projectResult.projectId) {
				await vercelService.connectGitRepository(projectResult.projectId, {
					type: "github" as const,
					repo: `${githubUsername}/${projectName}`,
				});
			}
		}

		return projectResult;
	}

	/**
	 * Trigger initial deployment
	 */
	private async triggerInitialDeployment(
		vercelService: VercelAPIService,
		projectId: string,
		projectName: string,
		deploymentId: string,
		userId: string,
		githubRepoId?: number
	): Promise<void> {
		try {
			const deploymentResult = await vercelService.createDeployment(
				projectId,
				projectName,
				"main",
				githubRepoId
			);
			if (deploymentResult.success && deploymentResult.deploymentUrl) {
				logger.info("Initial deployment triggered", { projectName, url: deploymentResult.deploymentUrl });
				await this.updateDeployment(deploymentId, userId, {
					vercelDeploymentId: deploymentResult.deploymentId,
					vercelDeploymentUrl: `https://${deploymentResult.deploymentUrl}`,
				});
			} else {
				logger.warn("Failed to trigger initial deployment", { projectName, error: deploymentResult.error });
			}
		} catch (error) {
			logger.warn("Error triggering initial deployment", { projectName, error });
		}
	}

	/**
	 * Poll for deployment status in the background
	 */
	private pollDeploymentStatus(
		vercelService: VercelAPIService,
		projectId: string,
		projectName: string,
		deploymentId: string,
		userId: string
	): void {
		const poll = async () => {
			let attempts = 0;

			while (attempts < MAX_DEPLOYMENT_POLL_ATTEMPTS) {
				attempts++;
				await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));

				try {
					const projectInfo = await vercelService.getProject(projectId);
					let latestDeployment = projectInfo.data?.latestDeployments?.[0];

					// Fallback: If latestDeployments isn't in the project response, fetch deployments explicitly
					// The Vercel API doesn't always include latestDeployments in the project endpoint
					if (!latestDeployment && projectInfo.success && projectInfo.data?.id) {
						const vercelDeployments = await vercelService.getDeployments(projectInfo.data.id, 1);
						if (vercelDeployments.length > 0) {
							latestDeployment = vercelDeployments[0];
						}
					}

					if (!latestDeployment?.state) {
						continue;
					}

					const resolvedStatus = resolveDeploymentStatusFromVercelState(
						latestDeployment.state
					);

					if (resolvedStatus.isTerminal) {
						const deploymentUrl = latestDeployment.url
							? `https://${latestDeployment.url}`
							: `https://${projectName}.vercel.app`;

						await this.updateDeployment(deploymentId, userId, {
							status: resolvedStatus.status,
							vercelDeploymentId: latestDeployment.uid ?? latestDeployment.id,
							vercelDeploymentUrl: deploymentUrl,
							error: resolvedStatus.error,
						});
						return;
					}
				} catch (error) {
					logger.warn("Deployment poll attempt failed", { attempts, projectName, error });
				}
			}

			// Polling ended without finding a terminal state
			// Leave status as "deploying" - syncDeploymentStatuses will update it on next page load
			logger.info("Deployment poll ended without terminal status, will sync on next page load", {
				projectName,
				attempts,
			});
		};

		poll().catch((error) => {
			logger.error("Failed to poll deployment status", { projectName, error });
		});
	}

	/**
	 * Convert error messages to user-friendly versions
	 */
	private getUserFriendlyError(errorMessage: string): string {
		if (errorMessage.includes("rate limit")) {
			return "Rate limit exceeded. Please wait a few minutes and try again.";
		}
		if (errorMessage.includes("authentication") || errorMessage.includes("unauthorized")) {
			return "Authentication failed. Please check your account connections.";
		}
		if (errorMessage.includes("already exists")) {
			return "A project with this name already exists. Please choose a different name.";
		}
		if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
			return "Network error occurred. Please check your connection and try again.";
		}
		return "Deployment failed. Please try again or contact support.";
	}
}

// Export singleton instance
export const deploymentService = new DeploymentService();
