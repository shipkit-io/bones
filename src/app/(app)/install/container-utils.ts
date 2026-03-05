"use client";

/**
 * WEBCONTAINER MANAGEMENT SYSTEM
 *
 * This file provides a comprehensive interface for managing WebContainer instances
 * in the browser environment. WebContainer is a browser-based runtime that enables
 * running Node.js applications directly in the browser without server-side execution.
 *
 * KEY FEATURES:
 * - Container lifecycle management (boot, install, run commands)
 * - File system operations and change tracking
 * - Package installation and dependency management
 * - Command execution with output streaming
 * - Template file processing and project setup
 *
 * IMPORTANT: This module runs client-side only as WebContainer requires browser APIs
 * and cannot function in server-side environments.
 *
 * @file container-utils.ts
 * @version 1.0.0
 * @author Shipkit Development Team
 */

import type { FileSystemTree } from "@webcontainer/api";
import { logInfo } from "./logging";
import { getAlternativePaths, getEssentialConfigFiles, ProjectPaths } from "./project-config";
import { processTemplateFiles } from "./shared-utils";
import type { ContainerFile } from "./types";

/**
 * GLOBAL CONTAINER STATE
 *
 * These variables maintain singleton state for the WebContainer instance
 * to prevent multiple containers from being created unnecessarily.
 */
let containerInstance: any = null;
let bootPromise: Promise<any> | null = null;

/**
 * CONTAINER MANAGER CLASS
 *
 * Provides a simplified, high-level interface for working with WebContainers.
 * This class manages the entire lifecycle of a WebContainer instance including:
 *
 * - Container initialization and boot process
 * - File system operations and change tracking
 * - Package installation and dependency management
 * - Command execution with real-time output streaming
 * - Template processing and project setup
 *
 * USAGE EXAMPLE:
 * ```typescript
 * const manager = new ContainerManager("/path/to/templates");
 * await manager.boot();
 * await manager.install("react");
 * const output = await manager.run("npm", ["start"]);
 * ```
 */
export class ContainerManager {
	/** WebContainer instance - the core runtime environment */
	private container: any;

	/** Flag indicating if container has been initialized and is ready for operations */
	private isReady = false;

	/** File system snapshot taken before operations to track changes */
	private fileSystemSnapshotBefore = new Map<string, string>();

	/** File system snapshot taken after operations to track changes */
	private fileSystemSnapshotAfter = new Map<string, string>();

	/** List of files that have been modified during container operations */
	private changedFiles: ContainerFile[] = [];

	/**
	 * Initialize a new ContainerManager instance
	 *
	 * @param templateBaseDir - Base directory path containing template files
	 *                         used for initializing the container file system
	 */
	constructor(private templateBaseDir: string) { }

	/**
	 * Initialize and boot the WebContainer instance
	 *
	 * This method handles the complete initialization process including:
	 * 1. Singleton pattern - reuses existing container if available
	 * 2. Dynamic WebContainer import (only loads when needed)
	 * 3. Template file processing and file system setup
	 * 4. Container boot process with error handling
	 *
	 * IMPORTANT: This method implements a singleton pattern to prevent
	 * multiple container instances, which can cause resource conflicts.
	 *
	 * @returns Promise<any> - The initialized WebContainer instance
	 * @throws Error if container fails to boot or template processing fails
	 */
	async boot() {
		// Return existing boot promise if container is already being initialized
		if (bootPromise) {
			return bootPromise;
		}

		// Return existing container instance if already booted
		if (containerInstance) {
			this.container = containerInstance;
			this.isReady = true;
			return Promise.resolve(this.container);
		}

		// Initialize new container instance
		bootPromise = (async () => {
			// Dynamic import to avoid loading WebContainer in server environments
			const { WebContainer } = await import("@webcontainer/api");

			// Process template files for initial file system setup
			const templateFiles = await processTemplateFiles(this.templateBaseDir);
			const templateFileSystem = new Map(templateFiles.map((file) => [file.path, file.content]));

			// Boot the WebContainer instance
			this.container = await WebContainer.boot();

			// Store singleton reference and mark as ready
			containerInstance = this.container;
			this.isReady = true;

			return this.container;
		})();

		return bootPromise;
	}

	/**
	 * Install a package in the WebContainer using npm
	 *
	 * This method handles npm package installation within the container
	 * with real-time output streaming and error handling.
	 *
	 * PROCESS FLOW:
	 * 1. Validate container is ready for operations
	 * 2. Spawn npm install process with specified package
	 * 3. Stream output in real-time using WritableStream
	 * 4. Monitor exit code and handle errors
	 *
	 * @param packageName - Name of the npm package to install
	 * @returns Promise<string> - Combined output from the installation process
	 * @throws Error if container is not ready or installation fails
	 */
	async install(packageName: string) {
		if (!this.isReady) {
			throw new Error("Container is not ready");
		}

		// Spawn npm install process within the container
		const installProcess = await this.container.spawn("npm", ["install", packageName]);

		const output: string[] = [];

		// Stream output from the installation process
		installProcess.output.pipeTo(
			new WritableStream({
				write: (chunk) => {
					const text = new TextDecoder().decode(chunk);
					output.push(text);
				},
			})
		);

		// Wait for process completion and check exit code
		const exitCode = await installProcess.exit;

		if (exitCode !== 0) {
			throw new Error(`Installation failed with exit code ${exitCode}`);
		}

		return output.join("");
	}

	/**
	 * Execute a command in the WebContainer
	 *
	 * This method provides a generic interface for running any command
	 * within the container environment with real-time output streaming.
	 *
	 * SUPPORTED COMMANDS:
	 * - bun/npm/yarn package manager commands (pnpm allowed for compatibility)
	 * - Node.js script execution
	 * - Build tools (webpack, vite, etc.)
	 * - Custom shell commands
	 *
	 * @param command - The command to execute (e.g., "npm", "node", "npx")
	 * @param args - Array of arguments to pass to the command
	 * @returns Promise<string> - Combined output from the command execution
	 * @throws Error if container is not ready or command fails
	 */
	async run(command: string, args: string[] = []) {
		if (!this.isReady) {
			throw new Error("Container is not ready");
		}

		// Spawn the specified command within the container
		const process = await this.container.spawn(command, args);

		const output: string[] = [];

		// Stream output from the command execution
		process.output.pipeTo(
			new WritableStream({
				write: (chunk) => {
					const text = new TextDecoder().decode(chunk);
					output.push(text);
				},
			})
		);

		// Wait for process completion and check exit code
		const exitCode = await process.exit;

		if (exitCode !== 0) {
			throw new Error(`Command failed with exit code ${exitCode}`);
		}

		return output.join("");
	}

	async getFileSystem(): Promise<FileSystemTree> {
		if (!this.isReady) {
			throw new Error("Container is not ready");
		}

		return this.container.fs.readdir("/", { withFileTypes: true });
	}

	async getFileContent(path: string): Promise<string> {
		if (!this.isReady) {
			throw new Error("Container is not ready");
		}

		const file = await this.container.fs.readFile(path);
		return new TextDecoder().decode(file);
	}

	async writeFile(path: string, content: string): Promise<void> {
		if (!this.isReady) {
			throw new Error("Container is not ready");
		}

		await this.container.fs.writeFile(path, content);
	}

	// Make sure components.json exists at the root
	private async ensureComponentsJsonExists(): Promise<void> {
		// Import the shared utility function
		const { ensureComponentsJsonExists } = await import("./shared-utils");
		// Use the shared implementation
		await ensureComponentsJsonExists(this.container, (path) => this.readTemplateFile(path));
	}

	private async readTemplateFile(filePath: string): Promise<string | Uint8Array | null> {
		try {
			// In the browser environment, we need to fetch the file
			if (typeof window !== "undefined") {
				const url = `/install/api/file?path=${encodeURIComponent(filePath)}`;
				logInfo(`Fetching file content from: ${url}`);

				const response = await fetch(url);

				if (!response.ok) {
					logInfo(`Failed to fetch template file: ${filePath}`, {
						status: response.status,
						statusText: response.statusText,
					});
					return null;
				}

				// Check content type to determine how to handle the response
				const contentType = response.headers.get("Content-Type") || "";
				logInfo(`Received content type: ${contentType} for file: ${filePath}`);

				// Handle binary files
				if (
					contentType.includes("image/") ||
					contentType.includes("font/") ||
					contentType.includes("application/octet-stream") ||
					contentType.includes("application/zip")
				) {
					// For binary files, return an ArrayBuffer
					const buffer = await response.arrayBuffer();
					return new Uint8Array(buffer);
				}

				// For text files, return text
				const text = await response.text();
				logInfo(`Received text content (${text.length} bytes) for file: ${filePath}`);
				return text;
			}
			return null;
		} catch (error) {
			logInfo(`Error reading template file ${filePath}:`, error);
			return null;
		}
	}

	// Preload template files to speed up later operations
	async preloadTemplateFiles(): Promise<void> {
		logInfo("Starting to preload template files");

		// Helper function to recursively process directory
		const processDirectory = async (directoryPath = ""): Promise<void> => {
			try {
				// Make a fetch request to get the directory listing
				const response = await fetch(
					`/install/api/template-files?path=${encodeURIComponent(directoryPath)}`
				);
				if (!response.ok) {
					logInfo(`Failed to fetch directory listing for ${directoryPath}`, response.statusText);
					return;
				}

				const entries = await response.json();
				logInfo(`Found ${entries.length} entries in ${directoryPath || "root"}`);

				// Create the directory in the container if it doesn't exist
				if (directoryPath) {
					try {
						await this.container.fs.mkdir(directoryPath, { recursive: true });
						logInfo(`Created directory ${directoryPath} in container`);
					} catch (err) {
						// Directory may already exist
						logInfo(`Note: Directory ${directoryPath} may already exist in container`);
					}
				}

				for (const entry of entries) {
					const fullPath = directoryPath ? `${directoryPath}/${entry.name}` : entry.name;

					if (entry.isDirectory) {
						// Process subdirectory recursively
						await processDirectory(fullPath);
					} else {
						// Read the file content
						const content = await this.readTemplateFile(fullPath);
						if (content !== null) {
							// Write file to the container
							try {
								await this.container.fs.writeFile(fullPath, content);
								logInfo(`Preloaded file: ${fullPath}`);
							} catch (writeError) {
								logInfo(`Error writing file ${fullPath} to container:`, writeError);
							}
						}
					}
				}
			} catch (error) {
				logInfo(`Error processing directory ${directoryPath}:`, error);
			}
		};

		// Start processing from root
		await processDirectory("");
		logInfo("Completed preloading template files");
	}

	// Process shadcn template upload
	async installShadcnTemplate(projectStructure: string): Promise<ContainerFile[]> {
		if (!this.isReady) {
			await this.boot();
		}

		try {
			logInfo("WebContainer initialized and ready");

			// Process all files from the shadcn template
			logInfo("Starting to process template files...");
			return await this.processTemplateFilesFromDisk(projectStructure);
		} catch (error) {
			logInfo(
				"Error occurred during installation",
				error instanceof Error ? error.message : String(error)
			);
			console.error("Error installing shadcn template:", error);
			throw error;
		}
	}

	// Process template files directly from disk (new method)
	private async processTemplateFilesFromDisk(projectStructure: string): Promise<ContainerFile[]> {
		const files: ContainerFile[] = [];

		logInfo(`Processing template files from disk for '${projectStructure}' structure`);

		// Helper function to recursively process directory
		const processDirectory = async (directoryPath = ""): Promise<void> => {
			try {
				// Make a fetch request to get the directory listing
				const response = await fetch(
					`/install/api/template-files?path=${encodeURIComponent(directoryPath)}`
				);
				if (!response.ok) {
					logInfo(`Failed to fetch directory listing for ${directoryPath}`, response.statusText);
					return;
				}

				const entries = await response.json();

				for (const entry of entries) {
					const fullPath = directoryPath ? `${directoryPath}/${entry.name}` : entry.name;

					if (entry.isDirectory) {
						// Process subdirectory recursively
						await processDirectory(fullPath);
					} else {
						// Read the file content
						const content = await this.readTemplateFile(fullPath);
						if (content !== null) {
							// Create target path based on project structure
							let targetPath = fullPath;

							// If the path needs adjustment based on project structure
							if (fullPath.startsWith("app/") && projectStructure === "src/app") {
								targetPath = `src/${fullPath}`;
								logInfo(`Adjusting path from ${fullPath} to ${targetPath} for src/app structure`);
							} else if (fullPath.startsWith("src/app/") && projectStructure === "app") {
								targetPath = fullPath.substring(4); // Remove "src/"
								logInfo(`Adjusting path from ${fullPath} to ${targetPath} for app structure`);
							}

							// Log file info - handle both string and binary content
							const contentLength =
								typeof content === "string" ? content.length : content.byteLength;
							logInfo(`Adding file: ${targetPath} (${contentLength} bytes)`);

							// Create directory structure if it doesn't exist
							const dirPath = targetPath.substring(0, targetPath.lastIndexOf("/"));
							if (dirPath) {
								try {
									await this.container.fs.mkdir(dirPath, { recursive: true });
								} catch (err) {
									// Ignore if directory already exists
									logInfo(`Note: Directory ${dirPath} may already exist`);
								}
							}

							// Write the file to the container - handle both string and binary content
							try {
								// For WebContainer fs.writeFile, we need different formats for text vs binary
								await this.container.fs.writeFile(targetPath, content);
								logInfo(`Successfully wrote file: ${targetPath}`);
							} catch (writeError) {
								logInfo(`Error writing file ${targetPath}:`, writeError);
							}

							// Add to the list of processed files - convert binary to base64 for storage
							files.push({
								path: targetPath,
								content:
									typeof content === "string" ? content : `[Binary data: ${contentLength} bytes]`, // For display only
							});
						}
					}
				}
			} catch (error) {
				logInfo(`Error processing directory ${directoryPath}:`, error);
			}
		};

		// Start processing from root
		await processDirectory("");

		// If unable to fetch template files, fallback to using the processTemplateFiles method
		if (files.length === 0) {
			logInfo(
				"No template files could be fetched from disk. Falling back to normal installation process."
			);

			// Log error but don't try to run shadcn init as a fallback
			logInfo(
				"Template files could not be processed. Please try again or use manual installation."
			);
			return [];
		}

		logInfo(`Processed ${files.length} files total from disk`);
		logInfo("Template file processing complete");
		return files;
	}

	// Helper method to run installation commands with proper process monitoring
	private async runInstallCommand(
		command: string,
		args: string[],
		description: string
	): Promise<void> {
		logInfo(`Running ${description}: ${command} ${args.join(" ")}`);

		try {
			// Modify args to auto-accept prompts if possible
			let modifiedArgs = [...args];

			// For npm and pnpm commands, add --yes flag if not already present
			if (
				(command === "npm" || command === "pnpm") &&
				!args.includes("--yes") &&
				!args.includes("-y")
			) {
				modifiedArgs.push("--yes");
			}

			// For npx, add --yes if not already present
			if (command === "npx" && !args.includes("--yes") && !args.includes("-y")) {
				// Add --yes before the package name
				if (modifiedArgs[0] === "--yes" || modifiedArgs[0] === "-y") {
					// already has it as first arg
				} else if (modifiedArgs.length > 0) {
					modifiedArgs = ["--yes", ...modifiedArgs];
				}
			}

			// If installing shadcn, make sure to auto-accept prompts
			const isShadcn = modifiedArgs.some((arg) => arg.includes("shadcn"));
			if (isShadcn && !modifiedArgs.includes("--yes") && !modifiedArgs.includes("-y")) {
				modifiedArgs.push("--yes");
			}

			logInfo(`Modified command to auto-accept prompts: ${command} ${modifiedArgs.join(" ")}`);

			// Start the process
			const process = await this.container.spawn(command, modifiedArgs);

			// Set up tracking variables
			let output = "";
			let lastOutputTime = Date.now();
			let isComplete = false;
			let installationStarted = false;
			let installationMessages = 0;

			// Create a reader for the output stream
			const reader = process.output.getReader();

			// Function to check if we've got indicators of completion
			const checkCompletionIndicators = (text: string): boolean => {
				const lowerText = text.toLowerCase();

				// Skip spinner animations which are often used for "Installing dependencies"
				// The ora spinner package uses these characters: ⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏
				if (/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/.exec(text) && lowerText.includes("installing")) {
					// This is most likely a spinner animation - not a completion indicator
					// Update the last activity time to prevent timeout
					lastOutputTime = Date.now();
					return false;
				}

				// Skip ANSI color/cursor control sequences (used by spinners and progress indicators)
				if (text.includes("\u001b[") || /\[\d+[A-Z]/.exec(text)) {
					// These are terminal control sequences, not actual completion indicators
					return false;
				}

				// Skip simple "installing dependencies" messages which aren't completion markers
				if (
					lowerText.trim() === "installing dependencies." ||
					lowerText.includes("installing dependencies...") ||
					/installing dependencies/i.exec(lowerText)
				) {
					// Update the last activity time to prevent timeout since we know work is happening
					lastOutputTime = Date.now();
					installationStarted = true;
					installationMessages++;

					logInfo(
						`Installation in progress (message #${installationMessages}), not considering as completion`
					);
					return false;
				}

				// General completion phrases
				if (
					lowerText.includes("done in") ||
					lowerText.includes("completed in") ||
					lowerText.includes("finished in") ||
					(lowerText.includes("added") && lowerText.includes("package"))
				) {
					logInfo("Detected completion phrase in output");
					return true;
				}

				// npm specific completion indicators
				if (command === "npm") {
					if (
						lowerText.includes("added ") ||
						lowerText.includes("up to date") ||
						lowerText.includes("packages are looking for funding")
					) {
						logInfo("Detected npm completion indicator");
						return true;
					}
				}

				// npx specific completion indicators for shadcn
				if (command === "npx" && isShadcn) {
					// For shadcn specifically, additional completion indicators
					if (
						// Common completion phrases for shadcn
						lowerText.includes("added dependencies") ||
						lowerText.includes("installed button") ||
						lowerText.includes("component added") ||
						lowerText.includes("components added") ||
						lowerText.includes("ready to use") ||
						(lowerText.includes("successfully") && lowerText.includes("installed")) ||
						// Installation complete phrases
						(lowerText.includes("tailwind") && lowerText.includes("configured")) ||
						(lowerText.includes("components") && lowerText.includes("ready")) ||
						// Component copy phrases
						lowerText.includes("component copied") ||
						(lowerText.includes("copying component") && lowerText.includes("complete")) ||
						// Configuration complete phrases
						(lowerText.includes("configuration") && !lowerText.includes("configuring")) ||
						lowerText.includes("tailwind.config") ||
						// Explicit completion
						lowerText.includes("import the styles in your app") ||
						lowerText.includes("for more information") ||
						// Error states
						lowerText.includes("error") ||
						lowerText.includes("failed") ||
						lowerText.includes("deprecated") ||
						lowerText.includes("please use the 'shadcn' package")
					) {
						logInfo("Detected shadcn completion indicator");
						return true;
					}

					// Handle installation progress - we now specifically exclude this as a completion indicator
					if (lowerText.includes("installing")) {
						installationStarted = true;
						installationMessages++;

						// Reset the last output time to avoid timeouts - we know the installation is ongoing
						lastOutputTime = Date.now();

						// Never consider "installing" as a completion indicator on its own
						logInfo(`Installation progress message #${installationMessages}, continuing to wait`);
						return false;
					}
				}

				// Other npx completion indicators
				if (command === "npx") {
					if (
						(lowerText.includes("installed") && !lowerText.includes("installing")) ||
						lowerText.includes("success") ||
						(lowerText.includes("components") && !lowerText.includes("installing"))
					) {
						logInfo("Detected npx completion indicator");
						return true;
					}
				}

				// If we've seen 20+ installation messages and haven't detected completion,
				// we should check if we're seeing any output at all
				if (installationStarted && installationMessages > 20) {
					// Keep updating the last output time to prevent timeouts
					lastOutputTime = Date.now();
					logInfo("Long-running installation in progress, continuing to wait");
				}

				return false;
			};

			// Function to handle automatic prompt responses
			const handlePrompts = (text: string) => {
				const hasPrompt =
					text.toLowerCase().includes("ok to proceed?") ||
					text.toLowerCase().includes("need to install") ||
					text.toLowerCase().includes("(y/n)") ||
					text.toLowerCase().includes("(y)");

				if (hasPrompt) {
					try {
						logInfo("Detected prompt, attempting to respond with 'y'");

						// Check if input exists and is writable
						if (process.input && typeof process.input.write === "function") {
							process.input.write("y\n");
							logInfo("Successfully wrote 'y' to process input");
						} else {
							// If we can't write to input, log but don't throw error
							// Commands should have --yes flags already
							logInfo("Unable to write to process input, relying on --yes flags");
						}
					} catch (e) {
						logInfo("Failed to handle prompt", e);
						// Don't throw - we'll rely on --yes flags
					}
				}
			};

			// Set up an activity watcher to detect idle processes
			const activityCheckInterval = setInterval(() => {
				const idleTime = Date.now() - lastOutputTime;

				// If we've been idle for more than 10 seconds and have output
				if (idleTime > 10000 && output.length > 0) {
					// Check if the output indicates completion
					if (checkCompletionIndicators(output)) {
						logInfo(`${description} appears to be complete based on output indicators`);
						isComplete = true;
						clearInterval(activityCheckInterval);
					} else if (installationStarted) {
						// For installations, be more lenient with idle time
						logInfo(
							`${description} has been installing for ${Math.round(idleTime / 1000)}s, still waiting...`
						);
						// Reset the last output time to prevent timeout during installation
						// Provide a 5-second buffer for output pauses to avoid false timeouts
						if (isShadcn) {
							lastOutputTime = Date.now() - 5000; // Provide 5-second buffer for output pauses
						}
					} else {
						logInfo(
							`${description} has been idle for ${Math.round(idleTime / 1000)}s, still waiting...`
						);
					}
				}
			}, 10000); // Check every 10 seconds instead of 3

			// Read output until we get completion indicators
			const maxWaitTime = 300000; // 5 minutes maximum wait (increased from 1 minute)
			const startTime = Date.now();

			try {
				let isDone = false;

				while (!isDone && !isComplete && Date.now() - startTime < maxWaitTime) {
					try {
						// Read with timeout to avoid blocking forever
						const readPromise = reader.read();
						const timeoutPromise = new Promise((resolve) => {
							setTimeout(() => resolve({ done: false, value: null }), 1000);
						});

						const result = await Promise.race([readPromise, timeoutPromise]);

						if (result.done) {
							isDone = true;
						} else if (result.value) {
							const chunk = result.value.toString();
							logInfo(`${description} output: ${chunk}`);
							output += chunk;
							lastOutputTime = Date.now();

							// Handle any prompts that might appear
							handlePrompts(chunk);

							// Check if this chunk indicates completion
							if (checkCompletionIndicators(chunk)) {
								logInfo(`${description} completion detected in output`);
								isComplete = true;
								break;
							}

							// Update UI with progress info for long-running processes
							if (
								chunk.includes("Installing dependencies") ||
								chunk.includes("installing") ||
								chunk.includes("downloading")
							) {
								installationStarted = true;
								installationMessages++;
							}
						}
					} catch (err) {
						logInfo(`Error reading output: ${err instanceof Error ? err.message : String(err)}`);
						// Continue trying to read
					}
				}
			} finally {
				// Clean up
				clearInterval(activityCheckInterval);
				reader.releaseLock();
			}

			// Check if we timed out
			if (Date.now() - startTime >= maxWaitTime && !isComplete) {
				logInfo(`${description} timed out after ${maxWaitTime / 1000} seconds`);
				throw new Error(
					`${description} process timed out after ${Math.floor(maxWaitTime / 60000)} minutes. This may be due to slow network or resource limits. Try again or use a more basic component.`
				);
			}

			// Log completion
			logInfo(`${description} completed successfully`);

			// Just to be safe, try to get the actual exit code
			try {
				const exitCode = await Promise.race([
					process.exit,
					new Promise<number>((resolve) => setTimeout(() => resolve(0), 500)),
				]);

				logInfo(`${description} exit code: ${exitCode}`);
			} catch (e) {
				// If we can't get the exit code but have completion indicators, that's fine
				if (isComplete) {
					logInfo(
						`${description} couldn't get exit code, but completed based on output indicators`
					);
				} else {
					throw new Error(`${description} failed: couldn't verify completion`);
				}
			}
		} catch (error) {
			logInfo(`${description} failed`, error);
			throw new Error(
				`${description} failed: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	// Process all files from the shadcn template
	private async processTemplateFiles(projectStructure: string): Promise<ContainerFile[]> {
		const files: ContainerFile[] = [];
		const processedPaths = new Set<string>();

		logInfo(`Processing template files for '${projectStructure}' structure`);

		// First, let's get the most important configuration files
		const configFiles = [
			"components.json",
			"tailwind.config.js",
			"tailwind.config.ts",
			"next.config.js",
			"next.config.ts",
			"tsconfig.json",
			"globals.css", // Look for this in various locations
			"global.css", // Alternative naming
			"package.json", // Get updated package.json
		];

		// Check root directory first
		for (const file of configFiles) {
			try {
				const content = await this.container.fs.readFile(file, "utf-8");
				logInfo(`Found config file ${file}:`, `${content.substring(0, 100)}...`);
				files.push({
					path: file,
					content: content,
				});
			} catch (err) {
				// Try different locations for CSS files
				if (file.endsWith(".css")) {
					const possibleCssPaths = [
						"app/globals.css",
						"src/app/globals.css",
						`styles/${file}`,
						`src/styles/${file}`,
						`app/styles/${file}`,
						`src/app/styles/${file}`,
					];

					for (const cssPath of possibleCssPaths) {
						try {
							const content = await this.container.fs.readFile(cssPath, "utf-8");
							logInfo(`Found CSS file at ${cssPath}:`, `${content.substring(0, 100)}...`);
							files.push({
								path: cssPath,
								content: content,
							});
							break; // Found one, stop looking
						} catch {
							// Continue trying other paths
						}
					}
				}
			}
		}

		// Common directory paths to check for theme files
		const themeFilePaths = [
			"components/ui/theme.ts",
			"components/ui/theme.js",
			"src/components/ui/theme.ts",
			"src/components/ui/theme.js",
			"lib/theme.ts",
			"lib/theme.js",
			"src/lib/theme.ts",
			"src/lib/theme.js",
			"styles/theme.ts",
			"styles/theme.js",
			"src/styles/theme.ts",
			"src/styles/theme.js",
		];

		// Check for theme configuration files
		for (const themePath of themeFilePaths) {
			try {
				const content = await this.container.fs.readFile(themePath, "utf-8");
				logInfo(`Found theme file at ${themePath}:`, `${content.substring(0, 100)}...`);
				files.push({
					path: themePath,
					content: content,
				});
			} catch {
				// Continue trying other paths
			}
		}

		// Now look for all component files
		const componentPaths = [
			"components",
			"src/components",
			"app/components",
			"src/app/components",
			"ui",
			"src/ui",
			"app/ui",
			"src/app/ui",
			"lib",
			"src/lib",
			"app/lib",
			"src/app/lib",
		];

		// Start recursive file processing
		logInfo("Starting recursive file processing");

		// Helper function to recursively process files
		const processDirectory = async (dirPath: string) => {
			try {
				// Skip if already processed
				if (processedPaths.has(dirPath)) {
					return;
				}
				processedPaths.add(dirPath);

				logInfo(`Processing directory: ${dirPath}`);
				const entries = await this.container.fs.readdir(dirPath, { recursive: false });
				logInfo(`Found ${entries.length} items in ${dirPath}`);

				for (const entry of entries) {
					// Skip if entry is null or undefined
					if (!entry?.name) {
						logInfo(`Skipping invalid entry in ${dirPath}`);
						continue;
					}

					const fullPath = `${dirPath}/${entry.name}`;

					if (processedPaths.has(fullPath)) {
						logInfo(`Skipping already processed path: ${fullPath}`);
						continue;
					}

					processedPaths.add(fullPath);

					try {
						// Try to get file stats
						const stats = await this.container.fs.stat(fullPath);
						const isDirectory = stats.isDirectory();

						if (isDirectory) {
							// Process subdirectory recursively
							await processDirectory(fullPath);
						} else {
							// Read file content
							try {
								const content = await this.container.fs.readFile(fullPath, "utf-8");

								// Create target path based on project structure
								let targetPath = fullPath;

								// If the path needs adjustment based on project structure
								if (fullPath.startsWith("app/") && projectStructure === "src/app") {
									targetPath = `src/${fullPath}`;
									logInfo(`Adjusting path from ${fullPath} to ${targetPath} for src/app structure`);
								} else if (fullPath.startsWith("src/app/") && projectStructure === "app") {
									targetPath = fullPath.substring(4); // Remove "src/"
									logInfo(`Adjusting path from ${fullPath} to ${targetPath} for app structure`);
								}

								logInfo(`Adding file: ${targetPath} (${content.length} bytes)`);
								files.push({
									path: targetPath,
									content: content,
								});
							} catch (readErr) {
								logInfo(
									`Error reading file ${fullPath}:`,
									readErr instanceof Error ? readErr.message : String(readErr)
								);
							}
						}
					} catch (statErr) {
						logInfo(
							`Error getting stats for ${fullPath}:`,
							statErr instanceof Error ? statErr.message : String(statErr)
						);
					}
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : String(err);
				logInfo(`Error processing directory ${dirPath}:`, errorMessage);
				// Don't throw an error for missing directories - just log and continue
			}
		};

		// Try to process each component directory if it exists
		for (const compPath of componentPaths) {
			if (await this.fileExists(compPath)) {
				logInfo(`Found component directory: ${compPath}`);
				await processDirectory(compPath);
			}
		}

		// If no files were found at all, check if we should generate minimal shadcn files
		if (files.length === 0) {
			logInfo("No shadcn files found. The initialization likely failed or was interrupted.");
			logInfo("Generating minimal shadcn configuration files for manual setup...");

			// Add minimal components.json if not found
			if (!files.some((f) => f.path === "components.json")) {
				const componentsJson = {
					$schema: "https://ui.shadcn.com/schema.json",
					style: "default",
					rsc: true,
					tsx: true,
					tailwind: {
						config: "tailwind.config.ts",
						css: "src/app/globals.css",
						baseColor: "neutral",
						cssVariables: true,
					},
					aliases: {
						components: "@/components",
						utils: "@/lib/utils",
					},
				};

				files.push({
					path: "components.json",
					content: JSON.stringify(componentsJson, null, 2),
				});

				logInfo("Generated components.json file");
			}

			// Add minimal utils file if not found
			const utilsFile = "src/lib/utils.ts";
			if (!files.some((f) => f.path === utilsFile)) {
				const utilsContent = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
			}
		}

		logInfo(`Processed ${files.length} files total`);
		logInfo("Template file processing complete");
		return files;
	}

	// Take a snapshot of the file system
	private async takeFileSystemSnapshot(): Promise<Map<string, string>> {
		const snapshot = new Map<string, string>();

		if (!this.container?.fs) {
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
				const entries = await this.container.fs.readdir(dirPath);

				for (const entryName of entries) {
					// Skip node_modules directory
					if (entryName === "node_modules") {
						logInfo(`Skipping node_modules directory: ${dirPath}/${entryName}`);
						continue;
					}

					// Skip lockfiles
					if (
						entryName === "package-lock.json" ||
						entryName === "yarn.lock" ||
						entryName === "pnpm-lock.yaml" ||
						entryName === ".pnpm-lock.yaml" ||
						entryName === "npm-shrinkwrap.json" ||
						entryName === "bun.lockb" ||
						entryName === "bun.lock"
					) {
						logInfo(`Skipping lockfile: ${dirPath}/${entryName}`);
						continue;
					}

					const fullPath = `${dirPath}/${entryName}`;

					try {
						// Try to determine if it's a directory by attempting to read it
						try {
							const subEntries = await this.container.fs.readdir(fullPath);
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
									const content = await this.container.fs.readFile(fullPath, "utf-8");
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

	// Compare two snapshots and return changed files
	private compareSnapshots(
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

	// Run a shadcn command and track file system changes
	async runShadcnCommand(command: string[]): Promise<ContainerFile[]> {
		if (!this.isReady) {
			await this.boot();
		}

		try {
			// Log the user's original command
			const originalCommand = [...command];
			logInfo(`Original command: ${originalCommand.join(" ")}`);

			// Parse the command to determine package manager and actual command
			let packageManager = "bunx";
			let actualCommand = [...command];

			// Check if command starts with a package manager
			const packageManagers = ["bunx", "bun", "npx", "pnpx", "pnpm", "npm", "yarn"];
			if (command.length > 0 && command[0] && packageManagers.includes(command[0])) {
				packageManager = command[0];
				actualCommand = command.slice(1);
			}

			// Take a snapshot of the file system before running the command
			logInfo("Taking snapshot of file system before command...");
			this.fileSystemSnapshotBefore = await this.takeFileSystemSnapshot();
			logInfo(`Initial snapshot captured: ${this.fileSystemSnapshotBefore.size} files`);

			// Just run the command as provided by the user
			logInfo(`Running command: ${packageManager} ${actualCommand.join(" ")}`);

			// Run the command directly without modification
			await this.runInstallCommand(
				packageManager,
				actualCommand,
				`${packageManager} ${actualCommand.join(" ")}`
			);

			// Take a snapshot after running the command
			logInfo("Taking snapshot of file system after command...");
			this.fileSystemSnapshotAfter = await this.takeFileSystemSnapshot();
			logInfo(`After snapshot captured: ${this.fileSystemSnapshotAfter.size} files`);

			// Compare snapshots to find changes
			this.changedFiles = this.compareSnapshots(
				this.fileSystemSnapshotBefore,
				this.fileSystemSnapshotAfter
			);
			logInfo(`Detected ${this.changedFiles.length} changed files after command execution`);

			return this.changedFiles;
		} catch (error) {
			logInfo(
				"Error running shadcn command",
				error instanceof Error ? error.message : String(error)
			);
			console.error("Error running shadcn command:", error);
			throw error;
		}
	}

	// Get the detected changed files
	getChangedFiles(): ContainerFile[] {
		return this.changedFiles;
	}

	/**
	 * Copies important files from the host project into the WebContainer
	 * This allows components to be added with correct project settings
	 */
	async importProjectFiles(files?: string[]): Promise<void> {
		if (!this.container) {
			throw new Error("Container not initialized");
		}

		logInfo("Importing project files", { count: files?.length || 0 });

		// Files to synchronize with the host project
		const targetFiles = files?.length ? files : getEssentialConfigFiles();

		try {
			for (const filePath of targetFiles) {
				try {
					// Check if file exists in current project
					if (await this.fileExists(filePath)) {
						// Get file content from the server
						const response = await fetch(`/install/api/file?path=${encodeURIComponent(filePath)}`);

						if (response.ok) {
							const content = await response.text();

							// Ensure directory exists
							const directory = filePath.split("/").slice(0, -1).join("/");
							if (directory) {
								await this.container.fs.mkdir(directory, { recursive: true });
							}

							// Write file to WebContainer
							await this.container.fs.writeFile(filePath, content);
							logInfo(`Imported project file: ${filePath}`);
						}
					} else {
						// Try alternative paths for essential files
						if (filePath === ProjectPaths.GLOBALS_CSS) {
							await this.tryAlternativePaths(getAlternativePaths("globals.css"));
						} else if (filePath === ProjectPaths.UTILS_TS) {
							await this.tryAlternativePaths(getAlternativePaths("utils.ts"));
						}
					}
				} catch (error) {
					console.warn(`Failed to import file ${filePath}:`, error);
				}
			}

			logInfo("Project files import completed");
		} catch (error) {
			console.error("Error importing project files:", error);
			throw error;
		}
	}

	/**
	 * Try to import files from alternative paths
	 * @param paths Array of alternative paths to try
	 */
	private async tryAlternativePaths(paths: string[]): Promise<boolean> {
		for (const path of paths) {
			try {
				if (await this.fileExists(path)) {
					const response = await fetch(`/install/api/file?path=${encodeURIComponent(path)}`);

					if (response.ok) {
						const content = await response.text();

						// Ensure directory exists
						const directory = path.split("/").slice(0, -1).join("/");
						if (directory) {
							await this.container.fs.mkdir(directory, { recursive: true });
						}

						// Write file to WebContainer
						await this.container.fs.writeFile(path, content);
						logInfo(`Imported alternative file: ${path}`);
						return true;
					}
				}
			} catch (error) {
				// Continue to the next path
			}
		}
		return false;
	}

	// Helper method to check if a file exists
	private async fileExists(path: string): Promise<boolean> {
		try {
			await this.container.fs.stat(path);
			return true;
		} catch {
			return false;
		}
	}
}

// Create a singleton instance
export const containerManager = typeof window !== "undefined" ? new ContainerManager("") : null;
