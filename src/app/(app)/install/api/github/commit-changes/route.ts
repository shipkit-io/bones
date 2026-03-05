import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { env } from "@/env";

export async function POST(req: Request) {
	try {
		const { branchName, commitMessage, files } = await req.json();

		// Validate required fields
		if (!branchName) {
			return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
		}

		if (!commitMessage?.trim()) {
			return NextResponse.json({ error: "Commit message is required" }, { status: 400 });
		}

		if (!files || !Array.isArray(files) || files.length === 0) {
			return NextResponse.json({ error: "No files to commit" }, { status: 400 });
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

		// After validation, we can safely assert these values are defined
		const owner = env.GITHUB_REPO_OWNER;
		const repo = env.GITHUB_REPO_NAME;

		// Sanitize and validate all file paths
		const sanitizedFiles = files.map((file) => ({
			...file,
			path: sanitizeFilePath(file.path),
		}));

		const octokit = new Octokit({
			auth: env.GITHUB_ACCESS_TOKEN,
		});

		// Get the latest commit of the branch to use as the base tree
		try {
			const { data: refData } = await octokit.git.getRef({
				owner,
				repo,
				ref: `heads/${branchName}`,
			});

			const baseSha = refData.object.sha;

			// Get the commit that the branch points to
			const { data: commitData } = await octokit.git.getCommit({
				owner,
				repo,
				commit_sha: baseSha,
			});

			// Create blobs for each file
			const blobs = await Promise.all(
				sanitizedFiles.map(async (file) => {
					const { data } = await octokit.git.createBlob({
						owner,
						repo,
						content: file.content,
						encoding: "utf-8",
					});
					return {
						path: file.path,
						mode: "100644" as const,
						type: "blob" as const,
						sha: data.sha,
					};
				})
			);

			// Create a new tree with the files
			const { data: treeData } = await octokit.git.createTree({
				owner,
				repo,
				base_tree: commitData.tree.sha,
				tree: blobs,
			});

			// Create a new commit
			const { data: newCommitData } = await octokit.git.createCommit({
				owner,
				repo,
				message: commitMessage.trim(),
				tree: treeData.sha,
				parents: [baseSha],
			});

			// Update the branch reference to point to the new commit
			const { data: updatedRef } = await octokit.git.updateRef({
				owner,
				repo,
				ref: `heads/${branchName}`,
				sha: newCommitData.sha,
			});

			return NextResponse.json({
				message: "Changes committed successfully",
				commitSha: newCommitData.sha,
				filesChanged: files.length,
			});
		} catch (gitError: any) {
			// Handle specific GitHub API errors
			if (gitError.status === 404) {
				return NextResponse.json(
					{
						error: "GitHub resource not found",
						details: "The specified branch, repository, or resource does not exist",
					},
					{ status: 404 }
				);
			}

			if (gitError.status === 401) {
				return NextResponse.json(
					{
						error: "GitHub authentication failed",
						details: "Please check your GitHub access token",
					},
					{ status: 401 }
				);
			}

			if (gitError.status === 403) {
				return NextResponse.json(
					{
						error: "GitHub permission denied",
						details:
							"You don't have permission to perform this action or you've hit the rate limit",
					},
					{ status: 403 }
				);
			}

			throw gitError; // Re-throw for general error handling
		}
	} catch (error) {
		console.error("Error committing changes:", error);

		// Provide more detailed error information based on error type
		const isGitHubError =
			error && typeof error === "object" && "status" in error && "message" in error;

		let errorMessage = "Failed to commit changes";
		let errorDetails = error instanceof Error ? error.message : String(error);

		// Extract specific GitHub API error information if available
		if (isGitHubError) {
			const gitHubError = error as any;
			errorMessage = `GitHub API error (${gitHubError.status})`;
			errorDetails = gitHubError.message || errorDetails;

			// Additional helpful information for common GitHub errors
			if (gitHubError.status === 422) {
				if (errorDetails.includes("tree.path")) {
					errorDetails +=
						". Some file paths may contain invalid characters or are not compatible with GitHub. Check for special characters in filenames.";
				}
			}
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

/**
 * Sanitizes file paths to be compatible with GitHub API requirements
 * Removes leading slashes, normalizes path separators, and handles special characters
 */
function sanitizeFilePath(filePath: string): string {
	if (!filePath) return "";

	// Remove any leading slashes
	let cleaned = filePath.replace(/^\/+/, "");

	// Normalize path separators to forward slashes
	cleaned = cleaned.replace(/\\/g, "/");

	// Remove any ".." path components which GitHub API rejects
	cleaned = cleaned
		.split("/")
		.filter((part) => part !== ".." && part !== ".")
		.join("/");

	// Remove any ~ or other special characters GitHub may reject
	cleaned = cleaned.replace(/[~^:?*[\]\\]/g, "_");

	// Ensure no path component starts with a dot (like .git)
	cleaned = cleaned
		.split("/")
		.map((part) => (part.startsWith(".") ? `_${part}` : part))
		.join("/");

	// Trim to remove any trailing whitespace
	cleaned = cleaned.trim();

	// Handle empty paths (fallback to a default name)
	if (!cleaned) {
		cleaned = "file.txt";
	}

	return cleaned;
}
