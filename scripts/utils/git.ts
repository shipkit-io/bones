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
			throw error;
		} else {
			const genericError = new Error(`Unknown error occurred while executing command: ${command}`);
			console.error(genericError.message);
			throw genericError;
		}
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
			runCommand('gh --version');
			hasGhCli = true;
		} catch (error) {
			// Let this error fall through to the manual instructions
			hasGhCli = false;
		}

		// If GitHub CLI is not installed, show manual instructions
		if (!hasGhCli) {
			console.log('\n==================================');
			console.log('✨  PULL REQUEST CREATION INSTRUCTIONS');
			console.log('==================================');
			console.log('\nGitHub CLI not found. You have two options:');
			console.log('\n1. Install GitHub CLI (recommended):');
			console.log('   brew install gh    # macOS');
			console.log('   winget install GitHub.cli    # Windows');
			console.log('   Then run: gh auth login');
			console.log('\n2. Create PR manually:');
			console.log('   Open this URL in your browser:');
			console.log(`   ${getRepoUrl()}/compare/${options.base}...${options.head}`);
			console.log('\n   Then fill in these details:');
			console.log(`   • Title: ${options.title}`);
			console.log(`   • Description: ${options.body}`);
			if (options.labels?.length) {
				console.log(`   • Labels: ${options.labels.join(', ')}`);
			}
			console.log('\n==================================\n');
			return;
		}

		// GitHub CLI is installed - create PR
		const labelArgs = options.labels?.length
			? options.labels.map(label => `--label "${label}"`).join(' ')
			: '';

		runCommand(
			`gh pr create --title "${options.title}" --body "${options.body}" ` +
			`--base ${options.base} --head ${options.head} ${labelArgs}`
		);
		console.log('✨ Pull request created successfully');
	} catch (error) {
		if (error instanceof Error) {
			console.debug('Error details:', error.message);
		}
		console.log('\n==================================');
		console.log('❌  PULL REQUEST CREATION FAILED');
		console.log('==================================');
		console.log('\nPlease create the PR manually:');
		console.log('\n1. Open this URL in your browser:');
		console.log(`   ${getRepoUrl()}/compare/${options.base}...${options.head}`);
		console.log('\n2. Fill in these details:');
		console.log(`   • Title: ${options.title}`);
		console.log(`   • Description: ${options.body}`);
		if (options.labels?.length) {
			console.log(`   • Labels: ${options.labels.join(', ')}`);
		}
		console.log('\n==================================\n');
	}
}

/**
 * Get the repository URL
 * @returns Repository URL or empty string if not found
 */
function getRepoUrl(): string {
	try {
		// Get the remote URL
		const remoteUrl = runCommand('git remote get-url origin').trim();

		// Convert SSH URL to HTTPS URL if necessary
		if (remoteUrl.startsWith('git@github.com:')) {
			return `https://github.com/${remoteUrl.slice(15).replace('.git', '')}`;
		}

		// Clean up HTTPS URL if necessary
		return remoteUrl.replace('.git', '').replace(/\n/g, '');
	} catch (error) {
		console.error('Failed to get repository URL:', error);
		return '';
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
