#!/usr/bin/env tsx

import { execSync } from "child_process";
import { format } from "date-fns";

/**
 * Script to create a git checkpoint branch with the current branch name and date,
 * push it to the remote, and return to the original branch.
 *
 * Usage: npx tsx scripts/git-checkpoint.ts
 */

try {
	// Get current branch name
	const currentBranch = execSync("git branch --show-current").toString().trim();
	console.log(`📝 Current branch: ${currentBranch}`);

	// Format date for branch name (YYYY-MM-DD-HHMMSS)
	const dateString = format(new Date(), "yyyy-MM-dd-HHmmss");

	// Create checkpoint branch name
	const checkpointBranch = `checkpoint-${currentBranch}-${dateString}`;
	console.log(`🔖 Creating checkpoint branch: ${checkpointBranch}`);

	// Create and checkout the checkpoint branch
	execSync(`git checkout -b ${checkpointBranch}`);

	// Push the checkpoint branch to the remote
	console.log(`📤 Pushing ${checkpointBranch} to remote...`);
	execSync(`git push -u origin ${checkpointBranch}`);

	// Return to the original branch
	console.log(`↩️ Returning to branch: ${currentBranch}`);
	execSync(`git checkout ${currentBranch}`);

	console.log("✅ Checkpoint created successfully");
} catch (error) {
	console.error("❌ Error creating checkpoint:", error);
	process.exit(1);
}
