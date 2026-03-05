import { execSync } from "child_process";
import { copyFile, mkdir, readdir, rm } from "fs/promises";
import { join, relative } from "path";

const EXCLUDED_DIRS = ["node_modules", ".next", ".git", "dist", "build", "temp"];

/*
 * Executes a git command and returns the output
 * @param command The git command to execute
 * @returns The command output
 */
function git(command: string): string {
	try {
		return execSync(`git ${command}`, { encoding: "utf-8" });
	} catch (error) {
		console.error(`Git command failed: git ${command}`);
		throw error;
	}
}

async function copyFiles(sourcePath: string, targetPath: string) {
	try {
		// Create target directory if it doesn't exist
		await mkdir(targetPath, { recursive: true });

		// Read source directory
		const entries = await readdir(sourcePath, { withFileTypes: true });

		for (const entry of entries) {
			const sourceFilePath = join(sourcePath, entry.name);
			const targetFilePath = join(targetPath, entry.name);

			// Skip excluded directories
			if (EXCLUDED_DIRS.includes(entry.name)) {
				console.log(`Skipping excluded directory: ${entry.name}`);
				continue;
			}

			if (entry.isDirectory()) {
				// Recursively copy subdirectories
				await copyFiles(sourceFilePath, targetFilePath);
			} else {
				// Copy individual files
				await copyFile(sourceFilePath, targetFilePath);
				console.log(`Copied: ${relative(process.cwd(), targetFilePath)}`);
			}
		}
	} catch (error) {
		console.error("Error copying files:", error);
		process.exit(1);
	}
}

async function main() {
	const sourceDir = process.cwd();
	const tempDir = join(sourceDir, "temp");
	const upstreamUrl = "https://github.com/shipkit-io/bones.git";

	console.log("Starting upstream sync process...");

	try {
		// Step 1: Save current files to temp directory
		console.log("\nSaving current files to temp directory...");
		await copyFiles(sourceDir, tempDir);

		// Step 2: Clean working directory (except temp)
		console.log("\nCleaning working directory...");
		const entries = await readdir(sourceDir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.name === "temp" || entry.name === ".git" || EXCLUDED_DIRS.includes(entry.name)) {
				continue;
			}
			await rm(join(sourceDir, entry.name), { recursive: true, force: true });
		}

		// Step 3: Setup upstream remote
		console.log("\nSetting up upstream remote...");
		try {
			git("remote remove up");
		} catch {
			// Ignore error if remote doesn't exist
		}
		git(`remote add up ${upstreamUrl}`);
		git("fetch up");

		// Step 4: Create temp branch from upstream
		console.log("\nCreating temp branch from upstream...");
		git("checkout up/main");
		git("switch -c temp");

		// Step 5: Copy files back from temp
		console.log("\nCopying files back from temp...");
		await copyFiles(tempDir, sourceDir);
		await rm(tempDir, { recursive: true, force: true });

		// Step 6: Commit the changes
		console.log("\nCommitting changes...");
		git("add .");
		git('commit -m "merge upstream changes"');

		// Step 7: Checkout main and merge changes
		console.log("\nChecking out main and merging changes...");
		git("checkout main");
		git("merge temp --allow-unrelated-histories");

		console.log("\nProcess completed successfully!");
		console.log("Please resolve any merge conflicts, then run:");
		console.log("git add .");
		console.log('git commit -m "added upstream"');
		console.log("git push");
	} catch (error) {
		console.error("Failed to sync with upstream:", error);
		process.exit(1);
	}
}

// Run the script
main().catch(console.error);
