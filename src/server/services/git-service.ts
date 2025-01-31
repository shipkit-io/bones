"use server";

import { Octokit } from "@octokit/rest";
import { runCommand } from "../../../scripts/utils/git";

interface CommitOptions {
	message?: string;
	createPR?: boolean;
	prTitle?: string;
	prBody?: string;
}

/**
 * Escape a string for shell command usage
 */
function escapeShellArg(arg: string): string {
	// For paths with special characters, just escape them with backslashes
	return arg.replace(/([()[\]<> "'$&;])/g, "\\$1");
}

// Initialize Octokit with the GitHub token
const octokit = process.env.GITHUB_TOKEN
	? new Octokit({ auth: process.env.GITHUB_TOKEN })
	: null;

/**
 * Commit file changes and optionally create a PR
 */
export async function commitFileChange(
	filePath: string,
	options: CommitOptions = {}
) {
	try {
		// Stage and commit the changes
		const escapedPath = escapeShellArg(filePath);

		// First, stage only our target file
		runCommand(`git add ${escapedPath}`);

		// Create the commit
		const commitMessage = options.message || `update: ${filePath}`;
		runCommand(`git commit -m ${escapeShellArg(commitMessage)}`);

		// Push the changes
		runCommand("git push origin HEAD");

		// If PR creation is requested and we have the GitHub token, create it
		if (options.createPR && octokit) {
			const currentBranch = runCommand("git rev-parse --abbrev-ref HEAD").trim();

			try {
				const repoUrl = runCommand("git config --get remote.origin.url");
				const [owner, repo] = repoUrl
					.replace("git@github.com:", "")
					.replace("https://github.com/", "")
					.replace(".git", "")
					.trim()
					.split("/");

				if (owner && repo) {
					const title = options.prTitle || `Content update: ${filePath}`;
					const body = options.prBody || "Content changes that need review.";

					await octokit.pulls.create({
						owner,
						repo,
						title,
						body,
						head: currentBranch,
						base: "main",
					});
				}
			} catch (prError) {
				console.warn("Failed to create PR, but changes were committed:", prError);
			}
		}
	} catch (error) {
		console.error("Git operation failed:", error);
	}
}

