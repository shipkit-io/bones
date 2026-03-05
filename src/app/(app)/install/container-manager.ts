"use client";

import type { WebContainer } from "@webcontainer/api";
import { importProjectFiles, readTemplateFile } from "./client-utils";
import { runInstallCommand } from "./command-utils";
import {
	compareSnapshots,
	fileExists,
	getInitialFileSystem,
	takeFileSystemSnapshot,
} from "./filesystem-utils";
import { logInfo } from "./logging";
import { getEssentialConfigFiles } from "./project-config";
import { ensureComponentsJsonExists } from "./shared-utils";
import type { ContainerFile } from "./types";

// Define essential configuration files
const ESSENTIAL_CONFIG_FILES = getEssentialConfigFiles();

// Track whether the container has already been booted
let containerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

// Improve debugging by explicitly tracking initialization state
let containerInitializing = false;

/**
 * Simplified interface for working with WebContainers
 */
export class ContainerManager {
	private container: WebContainer | null = null;
	private isReady = false;
	private fileSystemSnapshotBefore = new Map<string, string>();
	private fileSystemSnapshotAfter = new Map<string, string>();
	private changedFiles: ContainerFile[] = [];

	/**
	 * Get the component name from a shadcn command
	 * @param command The command array (e.g., ["add", "button"])
	 * @returns The component name or undefined
	 */
	private getComponentNameFromCommand(command: string[]): string | undefined {
		// If this is an "add" command, the second item is the component name
		if (command.length >= 2 && command[0] === "add") {
			return command[1];
		}
		return undefined;
	}

	/**
	 * Load essential files only for the WebContainer
	 * @param componentToInstall Optional component name to load dependencies for
	 */
	private async loadEssentialFiles(componentToInstall?: string): Promise<void> {
		if (!this.container) {
			throw new Error("Container not initialized");
		}

		logInfo("Setting up essential configuration files...");

		// Pass the array explicitly to avoid optional parameter confusion
		await importProjectFiles(
			this.container,
			(path) => fileExists(this.container!, path),
			ESSENTIAL_CONFIG_FILES
		);

		logInfo("Imported essential configuration files for shadcn installation");
	}

	/**
	 * Initialize the container when needed
	 * @param componentToInstall Optional component name to preload
	 */
	async initialize(componentToInstall?: string) {
		if (typeof window === "undefined") {
			throw new Error("WebContainer can only be initialized in the browser");
		}

		// If already initialized, just return
		if (this.isReady && this.container) {
			logInfo("Container already initialized, reusing existing instance");
			return true;
		}

		// Check for cross-origin isolation first
		if (typeof window !== "undefined" && !window.crossOriginIsolated) {
			console.warn("This page is not cross-origin isolated. WebContainers might not work.");
			throw new Error(
				"WebContainer requires cross-origin isolation. Please use the manual processing option instead."
			);
		}

		try {
			// Use the existing singleton container if it exists
			if (containerInstance) {
				this.container = containerInstance;
				this.isReady = true;
				logInfo("Reusing existing container instance");
				return true;
			}

			// If boot is already in progress, wait for it
			if (bootPromise) {
				logInfo("WebContainer boot already in progress, waiting for it to complete...");
				await bootPromise;
				this.container = containerInstance;
				this.isReady = true;
				logInfo("WebContainer boot completed, container is now available");
				return true;
			}

			// If another initialization is in progress, wait for it to complete
			if (containerInitializing) {
				logInfo(
					"Container initialization already in progress, waiting to avoid race conditions..."
				);

				// Wait for initialization to complete
				while (containerInitializing) {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}

				// If container was initialized during our wait, use it
				if (containerInstance) {
					this.container = containerInstance;
					this.isReady = true;
					logInfo(
						"Container initialization completed by another process, container is now available"
					);
					return true;
				}
			}

			// Mark initialization as in progress to prevent race conditions
			containerInitializing = true;

			// Dynamic import to avoid SSR issues
			const { WebContainer } = await import("@webcontainer/api");

			// Start booting and save the promise
			logInfo("Booting WebContainer...");
			bootPromise = WebContainer.boot();

			// Await the container boot
			this.container = await bootPromise;
			containerInstance = this.container;
			this.isReady = true;
			logInfo("WebContainer booted successfully");

			// After boot is complete, set bootPromise to null for future boots if needed
			bootPromise = null;

			// Set up a basic project structure
			logInfo("Setting up initial file system...");
			await this.container.mount(getInitialFileSystem());

			// Setup essential files
			await this.loadEssentialFiles(componentToInstall);

			// Check for components.json existence (but don't create it)
			await ensureComponentsJsonExists(this.container, readTemplateFile);

			logInfo("WebContainer initialization completed successfully");

			// Mark initialization as complete
			containerInitializing = false;

			return true;
		} catch (error) {
			// Reset state on error
			bootPromise = null;
			this.isReady = false;
			containerInitializing = false;

			console.error("Failed to initialize WebContainer:", error);

			// Provide more specific error message based on the error
			if (error instanceof Error) {
				if (
					error.message.includes("SharedArrayBuffer") ||
					error.message.includes("crossOriginIsolated")
				) {
					throw new Error(
						"WebContainer requires cross-origin isolation. The page must be served with the 'Cross-Origin-Opener-Policy: same-origin' and 'Cross-Origin-Embedder-Policy: require-corp' headers. Please use the manual processing option instead."
					);
				}

				if (
					error.message.includes("Unable to create more instances") ||
					error.message.includes("Only a single WebContainer instance")
				) {
					throw new Error(
						"A WebContainer instance is already running. Please refresh the page and try again."
					);
				}

				if (error.message.includes("timeout") || error.message.includes("timed out")) {
					throw new Error(
						"The WebContainer initialization timed out. This may be due to network issues or browser limitations. Please try again or use the manual processing option."
					);
				}

				if (error.message.includes("memory") || error.message.includes("out of memory")) {
					throw new Error(
						"WebContainer ran out of memory. Try closing other tabs or applications and refresh the page."
					);
				}
			}

			throw new Error(
				`Failed to initialize WebContainer: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Install shadcn by running the init command
	 */
	async installShadcnTemplate(): Promise<ContainerFile[]> {
		if (!this.isReady || !this.container) {
			throw new Error("Container not initialized");
		}

		try {
			logInfo("Starting shadcn initialization...");
			logInfo("WebContainer initialized and ready");

			// Take a snapshot of the file system before installation
			this.fileSystemSnapshotBefore = await takeFileSystemSnapshot(this.container);
			logInfo(`Taken snapshot before shadcn init with ${this.fileSystemSnapshotBefore.size} files`);

			// Run the shadcn init command
			const commandString = "npx shadcn@latest init --yes";
			await runInstallCommand(this.container, commandString);

			// Take another snapshot after running init
			this.fileSystemSnapshotAfter = await takeFileSystemSnapshot(this.container);
			logInfo(`Taken snapshot after shadcn init with ${this.fileSystemSnapshotAfter.size} files`);

			// Get the list of changed files
			this.changedFiles = compareSnapshots(
				this.fileSystemSnapshotBefore,
				this.fileSystemSnapshotAfter
			);
			logInfo(`Found ${this.changedFiles.length} changed files after shadcn init`);

			return this.changedFiles;
		} catch (error) {
			logInfo(
				"Error occurred during installation",
				error instanceof Error ? error.message : String(error)
			);
			console.error("Error installing shadcn:", error);
			throw error;
		}
	}

	/**
	 * Run a shadcn command in the container
	 * @param commandArray The command array to execute
	 */
	async runShadcnCommand(commandArray: string[]): Promise<ContainerFile[]> {
		try {
			// Get the component name if this is an add command
			const componentName = this.getComponentNameFromCommand(commandArray);

			// Initialize with component dependencies if applicable
			await this.initialize(componentName);

			if (!this.container) {
				throw new Error("Container not initialized");
			}

			// Take a snapshot of the file system before installation
			this.fileSystemSnapshotBefore = await takeFileSystemSnapshot(this.container);
			logInfo(
				`Taken snapshot before shadcn command with ${this.fileSystemSnapshotBefore.size} files`
			);

			// Run the command
			// Check if commandArray already includes npx shadcn@latest
			const commandString =
				commandArray[0] === "npx" && commandArray.length > 1 && commandArray[1] && commandArray[1].includes("shadcn")
					? commandArray.join(" ")
					: `npx shadcn@latest ${commandArray.join(" ")}`;

			await runInstallCommand(this.container, commandString);

			// Take another snapshot
			this.fileSystemSnapshotAfter = await takeFileSystemSnapshot(this.container);
			logInfo(
				`Taken snapshot after shadcn command with ${this.fileSystemSnapshotAfter.size} files`
			);

			// Get the list of changed files
			this.changedFiles = compareSnapshots(
				this.fileSystemSnapshotBefore,
				this.fileSystemSnapshotAfter
			);
			logInfo(`Found ${this.changedFiles.length} changed files after shadcn command`);

			return this.changedFiles;
		} catch (error) {
			logInfo(
				"Error occurred during shadcn command execution",
				error instanceof Error ? error.message : String(error)
			);
			console.error("Error running shadcn command:", error);
			throw error;
		}
	}

	/**
	 * Get the changed files from the last operation
	 */
	getChangedFiles(): ContainerFile[] {
		return this.changedFiles;
	}

	/**
	 * Import project files into the container
	 * @param files Optional array of specific files to import
	 */
	async importProjectFiles(files?: string[]): Promise<void> {
		await this.initialize();
		if (!this.container) {
			throw new Error("Container not initialized");
		}
		await importProjectFiles(
			this.container,
			(path) => fileExists(this.container!, path),
			files || ESSENTIAL_CONFIG_FILES
		);
	}
}
