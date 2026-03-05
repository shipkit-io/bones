"use client";

import { logInfo } from "./logging";
import { getAlternativePaths, ProjectPaths } from "./project-config";
import {
	BINARY_EXTENSIONS,
	sanitizePath,
	shouldIgnoreFile,
	TEMPLATE_BASE_DIR,
} from "./shared-utils";
import type { ContainerFile } from "./types";

// Client-side caches
const fileContentCache = new Map<string, string | Uint8Array>();
const directoryListingCache = new Map<string, string[]>();

/**
 * Read a template file from the file system
 * Uses caching to avoid repeated fetches
 */
export async function readTemplateFile(filePath: string): Promise<string | Uint8Array | null> {
	try {
		// Normalize and sanitize path
		const normalizedPath = sanitizePath(filePath);

		// Skip empty paths
		if (!normalizedPath) {
			logInfo("Skipping empty file path request");
			return null;
		}

		// Check cache first
		if (fileContentCache.has(normalizedPath)) {
			logInfo(`Using cached file content for: ${normalizedPath}`);
			return fileContentCache.get(normalizedPath) || null;
		}

		// Fetch directly from source components
		const url = `/install/api/file?path=${encodeURIComponent(normalizedPath)}`;
		logInfo(`Fetching file from: ${url}`);

		const response = await fetch(url);

		if (!response.ok) {
			logInfo(`Failed to fetch template file: ${normalizedPath}`, {
				status: response.status,
				statusText: response.statusText,
			});
			return null;
		}

		// Check content type to determine how to handle the response
		const contentType = response.headers.get("Content-Type") || "";
		logInfo(`Received content type: ${contentType} for file: ${normalizedPath}`);

		let content: string | Uint8Array;

		// Check if this is a binary file
		const fileExt = normalizedPath.substring(normalizedPath.lastIndexOf("."));
		if (
			BINARY_EXTENSIONS.includes(fileExt) ||
			contentType.startsWith("image/") ||
			contentType.includes("octet-stream")
		) {
			// For binary files, return an array buffer
			const buffer = await response.arrayBuffer();
			content = new Uint8Array(buffer);
			logInfo(`Received binary content (${content.length} bytes) for file: ${normalizedPath}`);
		} else {
			// For text files, return text
			content = await response.text();
			logInfo(`Received text content (${content.length} bytes) for file: ${normalizedPath}`);
		}

		// Add to cache
		fileContentCache.set(normalizedPath, content);
		return content;
	} catch (error) {
		logInfo(`Error reading template file ${filePath}:`, error);
		return null;
	}
}

/**
 * Get directory entries
 * Uses caching to avoid repeated fetches
 */
export async function getDirectoryEntries(directoryPath: string): Promise<string[]> {
	try {
		// Normalize path
		const normalizedPath = sanitizePath(directoryPath);

		// Check cache first
		if (directoryListingCache.has(normalizedPath)) {
			logInfo(`Using cached directory listing for: ${normalizedPath}`);
			return directoryListingCache.get(normalizedPath) || [];
		}

		const response = await fetch(
			`/install/api/template-files?path=${encodeURIComponent(normalizedPath)}`
		);
		if (!response.ok) {
			logInfo(`Failed to fetch directory listing for ${normalizedPath}`, response.statusText);
			return [];
		}

		const data = await response.json();

		// Ensure we have a valid array of entries
		if (!Array.isArray(data)) {
			logInfo(`Invalid directory listing response for ${normalizedPath}, expected array`);
			return [];
		}

		// Map complex objects to strings if needed
		const entries = data.map((entry) => {
			// If entry is an object with a name property, use that
			if (entry && typeof entry === "object" && "name" in entry) {
				return String(entry.name) + (entry.isDirectory ? "/" : "");
			}
			// Otherwise, convert to string
			return String(entry);
		});

		logInfo(`Found ${entries.length} entries in ${normalizedPath || "root"}`);

		// Cache the directory listing
		directoryListingCache.set(normalizedPath, entries);
		return entries;
	} catch (error) {
		logInfo(`Error getting directory entries for ${directoryPath}:`, error);
		return [];
	}
}

/**
 * Process template files based on the project structure
 * @param projectStructure The project structure to process (app or src/app)
 * @returns An array of container files
 */
export async function processTemplateFiles(projectStructure: string): Promise<ContainerFile[]> {
	const files: ContainerFile[] = [];

	logInfo(`Processing template files for '${projectStructure}' structure`);

	// Helper function to recursively process a directory
	async function processDirectory(dirPath: string = TEMPLATE_BASE_DIR) {
		const entries = await getDirectoryEntries(dirPath);

		for (const entry of entries) {
			const subPath = dirPath === TEMPLATE_BASE_DIR ? entry : `${dirPath}/${entry}`;

			// Skip if this file should be ignored
			if (shouldIgnoreFile(subPath)) {
				logInfo(`Skipping ignored file: ${subPath}`);
				continue;
			}

			// Check if it's a directory
			if (subPath.endsWith("/")) {
				// Recursively process subdirectories
				await processDirectory(subPath);
			} else {
				// Get file content
				const content = await readTemplateFile(subPath);

				// Skip if the content is null or not a string
				if (content === null || !(typeof content === "string")) {
					logInfo(`Skipping non-text file: ${subPath}`);
					continue;
				}

				// Adjust path based on project structure
				let targetPath = subPath;

				if (subPath.startsWith("app/") && projectStructure === "src/app") {
					targetPath = `src/${subPath}`;
					logInfo(`Adjusting path from ${subPath} to ${targetPath} for src/app structure`);
				} else if (subPath.startsWith("src/app/") && projectStructure === "app") {
					targetPath = subPath.substring(4); // Remove "src/"
					logInfo(`Adjusting path from ${subPath} to ${targetPath} for app structure`);
				}

				// Add the file to the result
				files.push({
					path: targetPath,
					content: content,
				});

				logInfo(`Processed file: ${targetPath} (${content.length} bytes)`);
			}
		}
	}

	// Start processing from the root
	await processDirectory();
	logInfo(`Processed ${files.length} files total`);

	return files;
}

/**
 * Import project files from host to container
 * @param container WebContainer instance
 * @param fileExists Function to check if a file exists
 * @param filesToImport Files to import
 */
export async function importProjectFiles(
	container: any,
	fileExists: (path: string) => Promise<boolean>,
	filesToImport: string[]
): Promise<void> {
	try {
		// First try to import the files normally
		for (const file of filesToImport) {
			try {
				// Check if the file already exists in the container
				if (await fileExists(file)) {
					logInfo(`File already exists in container: ${file}`);
					continue;
				}

				// Try to get the file from the server
				const response = await fetch(`/install/api/file?path=${encodeURIComponent(file)}`);

				if (response.ok) {
					const content = await response.text();

					// Create directory structure if needed
					const dir = file.substring(0, file.lastIndexOf("/"));
					if (dir) {
						await container.fs.mkdir(dir, { recursive: true });
					}

					// Write the file to the container
					await container.fs.writeFile(file, content);
					logInfo(`Imported project file: ${file}`);
				} else {
					logInfo(`File not found on server: ${file}, trying alternatives or defaults`);

					// For critical files, try to generate default content if not found
					if (file === ProjectPaths.GLOBALS_CSS) {
						await ensureGlobalsCss(container);
					} else if (file === ProjectPaths.UTILS_TS) {
						await ensureUtilsTs(container);
					}
				}
			} catch (error) {
				// For critical files, ensure they exist regardless of errors
				if (file === ProjectPaths.GLOBALS_CSS) {
					await ensureGlobalsCss(container);
				} else if (file === ProjectPaths.UTILS_TS) {
					await ensureUtilsTs(container);
				} else {
					logInfo(`Error importing file ${file}:`, error);
				}
			}
		}
	} catch (error) {
		logInfo("Error importing project files:", error);
	}
}

/**
 * Ensure globals.css exists in the container
 * Creates it with default content if it doesn't exist
 */
async function ensureGlobalsCss(container: any): Promise<void> {
	const path = ProjectPaths.GLOBALS_CSS;

	try {
		// Check if the file already exists
		try {
			await container.fs.stat(path);
			logInfo(`globals.css already exists at ${path}`);
			return;
		} catch {
			// File doesn't exist, continue with creation
		}

		// Try alternative paths first
		for (const altPath of getAlternativePaths("globals.css")) {
			try {
				await container.fs.stat(altPath);
				logInfo(`Found globals.css at alternative path: ${altPath}`);

				// Read content from alternative path
				const content = await container.fs.readFile(altPath, "utf-8");

				// Create the directory structure
				const dir = path.substring(0, path.lastIndexOf("/"));
				if (dir) {
					await container.fs.mkdir(dir, { recursive: true });
				}

				// Write to the target path
				await container.fs.writeFile(path, content);
				logInfo(`Copied globals.css from ${altPath} to ${path}`);
				return;
			} catch {
				// Continue to next alternative path
			}
		}

		// If no alternative paths work, create a default globals.css
	const defaultContent = `/* ! Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}`;

		// Create directory structure
		const dir = path.substring(0, path.lastIndexOf("/"));
		if (dir) {
			await container.fs.mkdir(dir, { recursive: true });
		}

		// Write the default content
		await container.fs.writeFile(path, defaultContent);
		logInfo(`Created default globals.css at ${path}`);
	} catch (error) {
		logInfo("Error ensuring globals.css exists:", error);
		throw error;
	}
}

/**
 * Ensure utils.ts exists in the container
 * Creates it with default content if it doesn't exist
 */
async function ensureUtilsTs(container: any): Promise<void> {
	const path = ProjectPaths.UTILS_TS;

	try {
		// Check if the file already exists
		try {
			await container.fs.stat(path);
			logInfo(`utils.ts already exists at ${path}`);
			return;
		} catch {
			// File doesn't exist, continue with creation
		}

		// Try alternative paths first
		for (const altPath of getAlternativePaths("utils.ts")) {
			try {
				await container.fs.stat(altPath);
				logInfo(`Found utils.ts at alternative path: ${altPath}`);

				// Read content from alternative path
				const content = await container.fs.readFile(altPath, "utf-8");

				// Create the directory structure
				const dir = path.substring(0, path.lastIndexOf("/"));
				if (dir) {
					await container.fs.mkdir(dir, { recursive: true });
				}

				// Write to the target path
				await container.fs.writeFile(path, content);
				logInfo(`Copied utils.ts from ${altPath} to ${path}`);
				return;
			} catch {
				// Continue to next alternative path
			}
		}

		// If no alternative paths work, create a default utils.ts
		const defaultContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
`;

		// Create directory structure
		const dir = path.substring(0, path.lastIndexOf("/"));
		if (dir) {
			await container.fs.mkdir(dir, { recursive: true });
		}

		// Write the default content
		await container.fs.writeFile(path, defaultContent);
		logInfo(`Created default utils.ts at ${path}`);
	} catch (error) {
		logInfo("Error ensuring utils.ts exists:", error);
		throw error;
	}
}
