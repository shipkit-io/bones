import { execSync } from "node:child_process";
import { format } from "date-fns";

/**
 * Escape a string for shell command usage
 */
function escapeShellArg(arg: string): string {
	// Wrap the entire argument in single quotes and escape any existing single quotes
	return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Git command execution utilities
 */
export function runCommand(command: string): string {
	try {
		// If this is a git add command, escape the file path
		const finalCommand = command.startsWith("git add ")
			? `git add ${escapeShellArg(command.slice("git add ".length))}`
			: command;

		return execSync(finalCommand, { encoding: "utf8", stdio: "pipe" });
	} catch (error) {
		console.error(`Error executing command: ${command}`);
		if (error instanceof Error) {
			console.error((error as { stderr?: string }).stderr || error.message);
		}
		throw error;
	}
}

/**
 * Generate a timestamp-based branch name
 * @param prefix - Branch name prefix
 * @returns Formatted branch name with timestamp
 */
export function generateBranchName(prefix: string): string {
	const timestamp = format(new Date(), "yyyyMMdd-HHmmss");
	return `${prefix}-${timestamp}`;
}

/**
 * Delete a branch locally and remotely
 * @param branchName - Name of the branch to delete
 * @param remote - Remote name (default: 'origin')
 */
export function deleteBranch(branchName: string, remote = "origin"): void {
	try {
		// Delete local branch if it exists
		runCommand(`git branch -D ${branchName} 2>/dev/null || true`);
		// Delete remote branch if it exists
		runCommand(`git push ${remote} --delete ${branchName} 2>/dev/null || true`);
	} catch (_error) {
		// Ignore errors since the branch might not exist
		console.info(`No existing branch '${branchName}' to clean up`);
	}
}

/**
 * Create a pull request using GitHub CLI or provide manual instructions
 * @param options - Pull request options
 */
export function createPullRequest(options: {
	title: string;
	body: string;
	base: string;
	head: string;
	labels?: string[];
}): void {
	try {
		// Check if gh CLI is installed
		let hasGhCli = false;
		try {
			runCommand("gh --version");
			hasGhCli = true;
		} catch (_error) {
			// Let this error fall through to the manual instructions
			hasGhCli = false;
		}

		// If GitHub CLI is not installed, show manual instructions
		if (!hasGhCli) {
			console.info("\n==================================");
			console.info("✨  PULL REQUEST CREATION INSTRUCTIONS");
			console.info("==================================");
			console.info("\nGitHub CLI not found. You have two options:");
			console.info("\n1. Install GitHub CLI (recommended):");
			console.info("   brew install gh    # macOS");
			console.info("   winget install GitHub.cli    # Windows");
			console.info("   Then run: gh auth login");
			console.info("\n2. Create PR manually:");
			console.info("   Open this URL in your browser:");
			console.info(`   ${getRepoUrl()}/compare/${options.base}...${options.head}`);
			console.info("\n   Then fill in these details:");
			console.info(`   • Title: ${options.title}`);
			console.info(`   • Description: ${options.body}`);
			if (options.labels?.length) {
				console.info(`   • Labels: ${options.labels.join(", ")}`);
			}
			console.info("\n==================================\n");
			return;
		}

		// GitHub CLI is installed - create PR
		const labelArgs = options.labels?.length
			? options.labels.map((label) => `--label "${label}"`).join(" ")
			: "";

		runCommand(
			`gh pr create --title "${options.title}" --body "${options.body}" ` +
				`--base ${options.base} --head ${options.head} ${labelArgs}`
		);
		console.info("✨ Pull request created successfully");
	} catch (error) {
		if (error instanceof Error) {
			console.debug("Error details:", error.message);
		}
		console.warn("\n==================================");
		console.warn("❌  PULL REQUEST CREATION FAILED");
		console.warn("==================================");
		console.warn("\nPlease create the PR manually:");
		console.warn("\n1. Open this URL in your browser:");
		console.warn(`   ${getRepoUrl()}/compare/${options.base}...${options.head}`);
		console.warn("\n2. Fill in these details:");
		console.warn(`   • Title: ${options.title}`);
		console.warn(`   • Description: ${options.body}`);
		if (options.labels?.length) {
			console.warn(`   • Labels: ${options.labels.join(", ")}`);
		}
		console.warn("\n==================================\n");
	}
}

/**
 * Get the repository URL
 * @returns Repository URL or empty string if not found
 */
function getRepoUrl(): string {
	try {
		// Get the remote URL
		const remoteUrl = runCommand("git remote get-url origin").trim();

		// Convert SSH URL to HTTPS URL if necessary
		if (remoteUrl.startsWith("git@github.com:")) {
			return `https://github.com/${remoteUrl.slice(15).replace(".git", "")}`;
		}

		// Clean up HTTPS URL if necessary
		return remoteUrl.replace(".git", "").replace(/\n/g, "");
	} catch (error) {
		console.error("Failed to get repository URL:", error);
		return "";
	}
}

/**
 * Verify current branch matches expected branch
 * @param expectedBranch - Expected branch name
 * @throws Error if not on expected branch
 */
export function verifyCurrentBranch(expectedBranch: string): void {
	const currentBranch = runCommand("git rev-parse --abbrev-ref HEAD").trim();
	if (currentBranch !== expectedBranch) {
		throw new Error(
			`Not on ${expectedBranch} branch. Please switch to ${expectedBranch} before running this script.`
		);
	}
}

/**
 * Verify remote exists
 * @param remote - Remote name to verify
 * @throws Error if remote doesn't exist
 */
export function verifyRemote(remote: string): void {
	try {
		runCommand(`git remote get-url ${remote}`);
	} catch (_error) {
		throw new Error(
			`Remote '${remote}' not found. Please add it using:\n` +
				`git remote add ${remote} <remote_url>`
		);
	}
}
