import { execSync } from "node:child_process";
import { Command } from "commander";
import {
	createPullRequest,
	deleteBranch,
	generateBranchName,
	runCommand,
	verifyCurrentBranch,
} from "./utils/git";

// Configuration
const UPSTREAM_REMOTE = "upstream";
const UPSTREAM_BRANCH = "main";
const CURRENT_BRANCH = "main";

// Bones is the root template. An existing `upstream` remote always wins; set
// UPSTREAM_REPO_URL to force a different upstream.
const UPSTREAM_REPOS: string[] = process.env.UPSTREAM_REPO_URL
	? [process.env.UPSTREAM_REPO_URL]
	: ["https://github.com/shipkit-io/bones.git"];

interface SyncOptions {
	direct: boolean;
	labels?: string[];
}

/**
 * Checks if a remote repository is accessible
 * Uses git ls-remote which is lightweight and doesn't clone
 */
function canAccessRepo(url: string): boolean {
	try {
		execSync(`git ls-remote ${url}`, { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

/**
 * Gets the first accessible upstream URL from the default list
 */
function getUpstreamUrl(): string {
	for (const url of UPSTREAM_REPOS) {
		console.info(`Checking access to ${url}...`);
		if (canAccessRepo(url)) {
			console.info(`✅ Using upstream: ${url}`);
			return url;
		}
		console.info(`⚠️ No access to ${url}, trying next...`);
	}
	throw new Error(
		"No accessible upstream repository found. Please check your GitHub authentication."
	);
}

/**
 * Ensures the upstream remote exists.
 * An existing remote is kept as-is (it was set by create-shipkit or by hand) unless
 * UPSTREAM_REPO_URL is set, which forces that URL.
 */
function ensureUpstreamRemote(): void {
	const forcedUrl = process.env.UPSTREAM_REPO_URL;

	try {
		const existingUrl = runCommand(`git remote get-url ${UPSTREAM_REMOTE}`).trim();

		if (forcedUrl && existingUrl !== forcedUrl) {
			console.info(
				`Updating upstream remote '${UPSTREAM_REMOTE}' from '${existingUrl}' to '${forcedUrl}'`
			);
			runCommand(`git remote set-url ${UPSTREAM_REMOTE} ${forcedUrl}`);
			return;
		}

		console.info(`Using existing remote '${UPSTREAM_REMOTE}' -> ${existingUrl}`);
	} catch {
		const upstreamUrl = getUpstreamUrl();
		console.info(`Adding upstream remote '${UPSTREAM_REMOTE}' -> ${upstreamUrl}`);
		runCommand(`git remote add ${UPSTREAM_REMOTE} ${upstreamUrl}`);
	}
}

async function syncUpstream(options: SyncOptions): Promise<void> {
	console.info("Syncing from upstream...");

	try {
		// Ensure upstream remote exists (add if missing)
		ensureUpstreamRemote();

		// Fetch the latest changes from upstream
		runCommand(`git fetch ${UPSTREAM_REMOTE}`);

		if (!options.direct) {
			const tempBranch = generateBranchName("sync-upstream");

			// Clean up any existing temp branch with same name (shouldn't exist due to timestamp)
			deleteBranch(tempBranch);

			// Create new temp branch from current branch
			runCommand(`git checkout -b ${tempBranch}`);

			try {
				// Merge upstream changes into temp branch
				console.info(
					`Merging changes from ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH} into ${tempBranch}...`
				);
				runCommand(`git merge ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}`);

				// Create and push PR
				runCommand(`git push -u origin ${tempBranch}`);

				createPullRequest({
					title: "chore: sync upstream changes",
					body: "Automated PR to sync changes from upstream repository",
					base: CURRENT_BRANCH,
					head: tempBranch,
					labels: options.labels,
				});
			} finally {
				// Always switch back to original branch
				runCommand(`git checkout ${CURRENT_BRANCH}`);
			}
		} else {
			// Verify we're on the correct branch for direct merge
			verifyCurrentBranch(CURRENT_BRANCH);

			// Merge upstream changes directly
			console.info(`Merging changes from ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}...`);
			runCommand(`git merge ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}`);
		}

		console.info("Update from upstream completed successfully.");
	} catch (error) {
		console.error("Failed to sync upstream:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

// CLI configuration
const program = new Command()
	.name("sync-upstream")
	.description("Sync changes from upstream repository")
	.option("-d, --direct", "Sync directly to current branch instead of creating PR", false)
	.option("-l, --labels <labels...>", "Labels to add to the PR")
	.action((options) => {
		syncUpstream({
			direct: options.direct,
			labels: options.labels,
		});
	});

program.parse(process.argv);
