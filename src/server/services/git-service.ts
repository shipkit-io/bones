"use server";

import { execSync } from "child_process";
import { Octokit } from "@octokit/rest";
import { runCommand } from "../../../scripts/utils/git";

interface CommitOptions {
    message?: string;
    createPR?: boolean;
    prTitle?: string;
    prBody?: string;
}

// Initialize Octokit with the GitHub token
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

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
        throw new Error("Failed to get repository information");
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
        runCommand(`git add ${filePath}`);
        runCommand(
            `git commit -m "${options.message || `update: ${filePath}`}"`,
        );

        // Push the changes
        if (options.createPR) {
            runCommand(`git push origin ${branchName}`);

            // Create PR using Octokit
            const { owner, repo } = getRepoInfo();
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

            // Switch back to main branch
            runCommand("git checkout main");
        } else {
            runCommand("git push origin HEAD");
        }
    } catch (error) {
        console.error("Git operation failed:", error);
        throw new Error("Failed to commit changes");
    }
}

