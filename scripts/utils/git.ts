import { execSync } from 'child_process';
import { format } from 'date-fns';

/**
 * Git command execution utilities
 */
export function runCommand(command: string): string {
	try {
		return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Error executing command: ${command}`);
			console.error((error as { stderr?: string }).stderr || error.message);
		} else {
			console.error(`Unknown error occurred while executing command: ${command}`);
		}
		process.exit(1);
	}
}

/**
 * Generate a timestamp-based branch name
 * @param prefix - Branch name prefix
 * @returns Formatted branch name with timestamp
 */
export function generateBranchName(prefix: string): string {
	const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
	return `${prefix}-${timestamp}`;
}

/**
 * Delete a branch locally and remotely
 * @param branchName - Name of the branch to delete
 * @param remote - Remote name (default: 'origin')
 */
export function deleteBranch(branchName: string, remote = 'origin'): void {
	try {
		// Delete local branch if it exists
		runCommand(`git branch -D ${branchName} 2>/dev/null || true`);
		// Delete remote branch if it exists
		runCommand(`git push ${remote} --delete ${branchName} 2>/dev/null || true`);
	} catch (error) {
		// Ignore errors since the branch might not exist
		console.log(`No existing branch '${branchName}' to clean up`);
	}
}

/**
 * Create a pull request using GitHub CLI
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
		const labelArgs = options.labels?.length
			? options.labels.map(label => `--label "${label}"`).join(' ')
			: '';

		runCommand(
			`gh pr create --title "${options.title}" --body "${options.body}" ` +
			`--base ${options.base} --head ${options.head} ${labelArgs}`
		);
		console.log('Pull request created successfully');
	} catch (error) {
		console.log('GitHub CLI not available. Please create PR manually:');
		console.log(`1. Visit your repository's website`);
		console.log(`2. Create a new PR from '${options.head}' into '${options.base}'`);
		if (error instanceof Error) {
			console.debug('Error details:', error.message);
		}
	}
}

/**
 * Verify current branch matches expected branch
 * @param expectedBranch - Expected branch name
 * @throws Error if not on expected branch
 */
export function verifyCurrentBranch(expectedBranch: string): void {
	const currentBranch = runCommand('git rev-parse --abbrev-ref HEAD').trim();
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
	} catch (error) {
		throw new Error(
			`Remote '${remote}' not found. Please add it using:\n` +
			`git remote add ${remote} <remote_url>`
		);
	}
}
