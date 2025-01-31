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

// Get repository information from the git config
function getRepoInfo() {
	try {
		const remoteUrl = runCommand("git config --get remote.origin.url");
		const [owner, repo] = remoteUrl
			.replace("git@github.com:", "")
			.replace("https://github.com/", "")
			.replace(".git", "")
			.trim()
			.split("/");

		if (!owner || !repo) {
			throw new Error("Invalid repository URL format");
		}

		return { owner, repo };
	} catch (error) {
		console.error("Error getting repo info:", error);
		return null;
	}
}

/**
 * Commit file changes and optionally create a PR
 */
export async function commitFileChange(
	filePath: string,
	options: CommitOptions = {}
) {
	try {
		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, "")
			.replace("T", "-")
			.replace("Z", "");
		const branchName = `content-${timestamp}`;

		// Create and switch to a new branch if creating a PR
		if (options.createPR) {
			runCommand(`git checkout -b ${branchName}`);
		}

		// Stage and commit the changes
		const escapedPath = escapeShellArg(filePath);
		runCommand(`git add ${escapedPath}`);
		runCommand(
			`git commit -m ${escapeShellArg(options.message || `update: ${filePath}`)}`
		);

		// Push the changes
		if (options.createPR) {
			runCommand(`git push origin ${branchName}`);

			// Only try to create PR if we have GitHub token and repo info
			if (octokit) {
				const repoInfo = getRepoInfo();
				if (repoInfo) {
					try {
						const { owner, repo } = repoInfo;
						const title = options.prTitle || `Content update: ${filePath}`;
						const body = options.prBody || "Content changes that need review.";

						await octokit.pulls.create({
							owner,
							repo,
							title,
							body,
							head: branchName,
							base: "main",
						});
					} catch (prError) {
						console.warn("Failed to create PR, but changes were committed:", prError);
					}
				}
			}

			// Switch back to main branch
			runCommand("git checkout main");
		} else {
			runCommand("git push origin HEAD");
		}
	} catch (error) {
		console.error("Git operation failed:", error);
		// Try to commit changes anyway, even if PR creation fails
		try {
			const escapedPath = escapeShellArg(filePath);
			runCommand(`git add ${escapedPath}`);
			runCommand(
				`git commit -m ${escapeShellArg(options.message || `update: ${filePath}`)}`
			);
			runCommand("git push origin HEAD");
		} catch (commitError) {
			console.error("Failed to commit changes:", commitError);
			throw new Error("Failed to commit changes");
		}
	}
}

