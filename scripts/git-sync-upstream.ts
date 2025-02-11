import { Command } from "commander";
import {
	createPullRequest,
	deleteBranch,
	generateBranchName,
	runCommand,
	verifyCurrentBranch,
	verifyRemote,
} from "./utils/git";

// Configuration
const UPSTREAM_REMOTE = "up";
const UPSTREAM_BRANCH = "main";
const CURRENT_BRANCH = "main";

interface SyncOptions {
	direct: boolean;
	labels?: string[];
}

async function syncUpstream(options: SyncOptions): Promise<void> {
	console.info("Syncing from upstream...");

	try {
		// Verify upstream remote exists
		verifyRemote(UPSTREAM_REMOTE);

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
