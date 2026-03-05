import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { env } from "@/env";

export async function POST(req: Request) {
	try {
		const { branchName, checkOnly } = await req.json();

		if (!branchName) {
			return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
		}

		// Validate GitHub environment variables
		if (!env.GITHUB_ACCESS_TOKEN || !env.GITHUB_REPO_OWNER || !env.GITHUB_REPO_NAME) {
			return NextResponse.json(
				{
					error: "GitHub configuration is incomplete",
					details: "Missing required environment variables",
				},
				{ status: 500 }
			);
		}

		const octokit = new Octokit({
			auth: env.GITHUB_ACCESS_TOKEN,
		});

		try {
			// Try to get the reference to check if branch exists
			const { data: refData } = await octokit.git.getRef({
				owner: env.GITHUB_REPO_OWNER,
				repo: env.GITHUB_REPO_NAME,
				ref: `heads/${branchName}`,
			});

			// If we get here, the branch exists
			if (checkOnly) {
				return NextResponse.json({ exists: true });
			}

			return NextResponse.json(
				{ error: "Branch already exists", details: "Please use a different branch name" },
				{ status: 409 }
			);
		} catch (error: any) {
			// 404 means branch doesn't exist, which is what we want for creation
			if (error.status === 404) {
				if (checkOnly) {
					return NextResponse.json({ exists: false });
				}

				// Get the SHA of the default branch
				const { data: defaultBranch } = await octokit.repos.get({
					owner: env.GITHUB_REPO_OWNER,
					repo: env.GITHUB_REPO_NAME,
				});

				const { data: ref } = await octokit.git.getRef({
					owner: env.GITHUB_REPO_OWNER,
					repo: env.GITHUB_REPO_NAME,
					ref: `heads/${defaultBranch.default_branch}`,
				});

				// Create the new branch
				const { data: newRef } = await octokit.git.createRef({
					owner: env.GITHUB_REPO_OWNER,
					repo: env.GITHUB_REPO_NAME,
					ref: `refs/heads/${branchName}`,
					sha: ref.object.sha,
				});

				return NextResponse.json({
					message: "Branch created successfully",
					sha: newRef.object.sha,
				});
			}

			// If it's not a 404, it's an actual error
			throw error;
		}
	} catch (error) {
		console.error("Error creating branch:", error);

		const isGitHubError = error && typeof error === "object" && "status" in error;
		let errorMessage = "Failed to create branch";
		let errorDetails = error instanceof Error ? error.message : String(error);

		if (isGitHubError) {
			const gitHubError = error as any;
			if (gitHubError.status === 401) {
				return NextResponse.json(
					{
						error: "GitHub authentication failed",
						details: "Please check your GitHub access token",
					},
					{ status: 401 }
				);
			}
			if (gitHubError.status === 403) {
				return NextResponse.json(
					{
						error: "GitHub permission denied",
						details: "You don't have permission to create branches",
					},
					{ status: 403 }
				);
			}
			errorMessage = `GitHub API error (${gitHubError.status})`;
			errorDetails = gitHubError.message || errorDetails;
		}

		return NextResponse.json(
			{
				error: errorMessage,
				details: errorDetails,
			},
			{ status: 500 }
		);
	}
}
