"use server";

import { env } from "@/env";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { Octokit } from "@octokit/rest";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createRepositorySchema = z.object({
	template: z.object({
		owner: z.string(),
		name: z.string(),
	}),
});

const deploySchema = z.object({
	repoUrl: z.string().url(),
	teamId: z.string(),
	projectName: z.string(),
});

const vercelDeployUrlSchema = z.object({
	repository: z.string().url(),
	teamId: z.string().optional(),
	project: z.string(),
});

/**
 * Creates a new repository from the template
 */
export async function createRepository(formData: FormData) {
	const session = await auth();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const raw = {
		template: {
			owner: formData.get("owner"),
			name: formData.get("name"),
		},
	};

	const parsed = createRepositorySchema.safeParse(raw);
	if (!parsed.success) {
		throw new Error("Invalid input");
	}

	try {
		// Get the GitHub token from the user's accounts
		const githubAccount = await db.query.accounts.findFirst({
			where: (accounts, { and, eq }) =>
				and(
					eq(accounts.userId, session.user.id),
					eq(accounts.provider, "github"),
				),
		});
		console.log(githubAccount);

		if (!githubAccount?.access_token) {
			throw new Error("GitHub account not connected");
		}

		const octokit = new Octokit({
			auth: githubAccount.access_token,
		});

		// First verify the template repository exists and is accessible
		try {
			await octokit.repos.get({
				owner: parsed.data.template.owner,
				repo: parsed.data.template.name,
			});
		} catch (error) {
			console.error("Error accessing template repository:", error);
			throw new Error(
				"Template repository not found or not accessible. Please ensure you have access to the template repository.",
			);
		}

		// Create repository from template
		const uniqueName = `${parsed.data.template.name}-${Date.now().toString(36)}`;
		const response = await octokit.repos.createUsingTemplate({
			template_owner: parsed.data.template.owner,
			template_repo: parsed.data.template.name,
			name: uniqueName,
			private: true,
			description: "My instance of crossover",
			include_all_branches: true,
		});

		revalidatePath("/setup");
		return {
			url: response.data.html_url,
			name: response.data.name,
			fullName: response.data.full_name,
		};
	} catch (error) {
		console.error("Repository creation error:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to create repository",
		);
	}
}

/**
 * Deploys the repository to Vercel
 */
export async function deploy(formData: FormData) {
	const session = await auth();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const raw = {
		repoUrl: formData.get("repoUrl"),
		teamId: formData.get("teamId"),
		projectName: formData.get("projectName"),
	};

	const parsed = deploySchema.safeParse(raw);
	if (!parsed.success) {
		throw new Error("Invalid input");
	}

	try {
		if (!env.VERCEL_ACCESS_TOKEN) {
			throw new Error(
				"Vercel access token not configured. Please add VERCEL_ACCESS_TOKEN to your environment variables.",
			);
		}

		// Extract repo details from GitHub URL
		// Example: https://github.com/owner/repo -> owner/repo
		const repoUrlParts = parsed.data.repoUrl.match(
			/github\.com\/([^/]+)\/([^/]+)/,
		);
		if (!repoUrlParts || !repoUrlParts[1] || !repoUrlParts[2]) {
			throw new Error("Invalid GitHub repository URL format");
		}

		const [, owner, repo] = repoUrlParts;
		console.log("Creating deployment for:", {
			owner,
			repo,
			projectName: parsed.data.projectName,
		});

		// Create deployment on Vercel
		const createDeploymentResponse = await fetch(
			"https://api.vercel.com/v13/deployments",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.VERCEL_ACCESS_TOKEN}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: parsed.data.projectName,
					gitSource: {
						type: "github",
						org: owner,
						repo,
						ref: "main", // or the branch you want to deploy
					},
					projectSettings: {
						framework: "nextjs",
						buildCommand: "pnpm run build",
						installCommand: "pnpm install",
						outputDirectory: ".next",
						nodeVersion: "20.x",
					},
					target: "production",
					teamId: parsed.data.teamId || undefined,
				}),
			},
		);

		if (!createDeploymentResponse.ok) {
			const errorText = await createDeploymentResponse.text();
			console.error("Error creating Vercel deployment:", {
				status: createDeploymentResponse.status,
				statusText: createDeploymentResponse.statusText,
				error: errorText,
				request: {
					owner,
					repo,
					projectName: parsed.data.projectName,
					teamId: parsed.data.teamId,
				},
			});
			throw new Error(`Failed to create Vercel deployment: ${errorText}`);
		}

		const deployment = await createDeploymentResponse.json();
		if (!deployment.id) {
			console.error("Invalid deployment response:", deployment);
			throw new Error("No deployment ID returned from Vercel");
		}

		console.log("Deployment created:", {
			id: deployment.id,
			name: deployment.name,
			url: deployment.url,
		});

		revalidatePath("/setup");
		return { deploymentId: deployment.id };
	} catch (error) {
		console.error("Deployment error:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to deploy",
		);
	}
}

/**
 * Gets the deployment status
 */
export async function getDeploymentStatus(deploymentId: string) {
	const session = await auth();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	try {
		if (!env.VERCEL_ACCESS_TOKEN) {
			throw new Error(
				"Vercel access token not configured. Please add VERCEL_ACCESS_TOKEN to your environment variables.",
			);
		}

		console.log("Checking deployment status for:", deploymentId);

		const response = await fetch(
			`https://api.vercel.com/v13/deployments/${deploymentId}`,
			{
				headers: {
					Authorization: `Bearer ${env.VERCEL_ACCESS_TOKEN}`,
				},
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Error getting deployment status:", {
				status: response.status,
				statusText: response.statusText,
				error: errorText,
				deploymentId,
			});
			throw new Error(`Failed to get deployment status: ${errorText}`);
		}

		const data = await response.json();
		console.log("Deployment status response:", {
			id: data.id,
			name: data.name,
			state: data.readyState,
			url: data.url,
		});

		const status = data.readyState?.toLowerCase();
		const url = data.url ? `https://${data.url}` : undefined;

		revalidatePath("/setup");
		return { status, url };
	} catch (error) {
		console.error("Error getting deployment status:", error);
		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to get deployment status",
		);
	}
}

/**
 * Generates a Vercel deploy URL
 */
export async function getVercelDeployUrl(formData: FormData) {
	const session = await auth();
	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const raw = {
		repository: formData.get("repository"),
		teamId: formData.get("teamId"),
		project: formData.get("project"),
	};

	const parsed = vercelDeployUrlSchema.safeParse(raw);
	if (!parsed.success) {
		throw new Error("Invalid input");
	}

	try {
		const params = new URLSearchParams({
			repository: parsed.data.repository,
			projectName: parsed.data.project,
			...(parsed.data.teamId ? { teamId: parsed.data.teamId } : {}),
			framework: "nextjs",
			env: [
				// "NEXT_PUBLIC_APP_URL",
				// "NEXT_PUBLIC_VERCEL_URL",
				// "DATABASE_URL",
				// "AUTH_GITHUB_ID",
				// "AUTH_GITHUB_SECRET",
				"AUTH_SECRET",
			].join(","),
			envDescription: "Required environment variables for the application",
			demo: "1",
			integration: "github",
		});

		return { deployUrl: `https://vercel.com/new/clone?${params.toString()}` };
	} catch (error) {
		console.error("Error generating deploy URL:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to generate deploy URL",
		);
	}
}
