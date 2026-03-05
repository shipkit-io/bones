"use client";

import type { FileSystemTree } from "@webcontainer/api";
import { logInfo } from "./logging";
import { ensureComponentsJsonExists, shouldIgnoreFile } from "./shared-utils";
import type { ContainerFile } from "./types";

/**
 * Get the initial file system for the container
 */
export function getInitialFileSystem(): FileSystemTree {
	return {
		"index.js": {
			file: {
				contents: `console.log('WebContainer initialized');`,
			},
		},
	};
}

/**
 * Check if a file is essential based on config files and directories
 * @param path File path to check
 * @param essentialFiles Array of essential file paths
 * @param essentialDirs Array of essential directory paths
 */
export function isEssentialPath(
	path: string,
	essentialFiles: string[],
	essentialDirs: string[]
): boolean {
	// Normalize path
	const normalizedPath = path.replace(/^\.\//, "").replace(/^\/+/, "");

	// Check if it matches an essential file exactly
	if (essentialFiles.includes(normalizedPath)) {
		return true;
	}

	// Check if it's in an essential directory
	return essentialDirs.some((dir) => normalizedPath.startsWith(dir + "/"));
}

/**
 * Check if a file or directory exists in the container
 */
export async function fileExists(container: any, path: string): Promise<boolean> {
	try {
		await container.fs.stat(path);
		return true;
	} catch (err) {
		return false;
	}
}

// Re-export the ensureComponentsJsonExists function from shared-utils
export { ensureComponentsJsonExists };

/**
 * Take a snapshot of the file system
 */
export async function takeFileSystemSnapshot(container: any): Promise<Map<string, string>> {
	const snapshot = new Map<string, string>();

	if (!container?.fs) {
		logInfo("Container or filesystem not available for snapshot");
		return snapshot;
	}

	// Helper function to recursively process directories
	const processDirectory = async (dirPath: string): Promise<void> => {
		try {
			// Skip node_modules directory
			if (dirPath === "node_modules" || dirPath.includes("/node_modules/")) {
				logInfo(`Skipping node_modules directory: ${dirPath}`);
				return;
			}

			logInfo(`Reading directory: ${dirPath}`);

			// Read directory entries
			const entries = await container.fs.readdir(dirPath);

			for (const entryName of entries) {
				// Skip node_modules directory
				if (entryName === "node_modules") {
					logInfo(`Skipping node_modules directory: ${dirPath}/${entryName}`);
					continue;
				}

				const fullPath = `${dirPath}/${entryName}`;

				// Use shouldIgnoreFile function for consistent filtering
				if (shouldIgnoreFile(fullPath)) {
					logInfo(`Skipping ignored file: ${fullPath}`);
					continue;
				}

				try {
					// Try to determine if it's a directory by attempting to read it
					try {
						const subEntries = await container.fs.readdir(fullPath);
						// If we get here, it's a directory
						logInfo(`Found directory: ${fullPath}`);
						await processDirectory(fullPath);
					} catch (readError) {
						// If we can't read it as a directory, assume it's a file
						// Skip binary files based on extension
						const extension = fullPath.split(".").pop()?.toLowerCase() || "";
						const binaryExtensions = [
							"png",
							"jpg",
							"jpeg",
							"gif",
							"ico",
							"woff",
							"woff2",
							"ttf",
							"eot",
							"pdf",
							"zip",
						];

						if (!binaryExtensions.includes(extension)) {
							try {
								// Try to read the file
								const content = await container.fs.readFile(fullPath, "utf-8");
								logInfo(`Added file to snapshot: ${fullPath} (${content.length} bytes)`);
								snapshot.set(fullPath, content);
							} catch (fileReadError) {
								logInfo(`Error reading file ${fullPath}:`, fileReadError);
							}
						} else {
							logInfo(`Skipping binary file: ${fullPath}`);
						}
					}
				} catch (err) {
					logInfo(`Error processing entry ${fullPath}:`, err);
				}
			}
		} catch (err) {
			logInfo(`Error reading directory ${dirPath}:`, err);
		}
	};

	// Start the snapshot from root
	try {
		await processDirectory(".");
	} catch (err) {
		logInfo("Error taking file system snapshot:", err);
	}

	return snapshot;
}

/**
 * Compare two snapshots and return changed files
 */
export function compareSnapshots(
	before: Map<string, string>,
	after: Map<string, string>
): ContainerFile[] {
	const changedFiles: ContainerFile[] = [];

	// Check for new and modified files
	after.forEach((content, path) => {
		if (!before.has(path) || before.get(path) !== content) {
			changedFiles.push({
				path,
				content,
			});
		}
	});

	return changedFiles;
}
