"use client";

import { AlertTriangleIcon, FileIcon, InfoIcon, TerminalIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type FileChange, FileChangeDisplay } from "../_components/file-change-display";
import { GitHubIntegration } from "../_components/github-integration";
import { processTerminalOutput } from "../command-utils";
import { ContainerManager } from "../container-manager";

// Create a singleton container manager
let containerManagerInstance: ContainerManager | null = null;

// Get or create the container manager instance
function getContainerManager(): ContainerManager {
	if (!containerManagerInstance) {
		containerManagerInstance = new ContainerManager();
	}
	return containerManagerInstance;
}

// Use a smaller refresh interval for more responsive animations
const TERMINAL_REFRESH_INTERVAL = 30; // 33 fps for very smooth spinner animation

// Dynamically import XTerm to avoid SSR issues
const XTermComponent = dynamic(() => import("./xterm-component").then((mod) => mod.default), {
	ssr: false,
	loading: () => <div className="text-sm text-muted-foreground">Loading terminal...</div>,
});

interface ShadcnCommandProps {
	containerReady?: boolean;
	webContainerSupported?: boolean;
	onExecute?: (files: { path: string; content: string }[]) => void;
	autoRun?: boolean;
}

export const ShadcnCommand = ({
	containerReady = false,
	webContainerSupported = false,
	onExecute,
	autoRun = false,
}: ShadcnCommandProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [command, setCommand] = useState("npx shadcn@latest add button");
	const [commandOutput, setCommandOutput] = useState<string>("");
	const [commandError, setCommandError] = useState<string>("");
	const [changedFiles, setChangedFiles] = useState<FileChange[]>([]);
	const [activeTab, setActiveTab] = useState("command");
	const [progressMessage, setProgressMessage] = useState("");
	const [isCommandQueued, setIsCommandQueued] = useState(false);
	const hasAutoRun = useRef(false);
	const queuedCommand = useRef<string | null>(null);
	const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
	const [loadingMessage, setLoadingMessage] = useState<string>("");
	const terminalRef = useRef<any>(null);

	const makeCommand = useCallback(() => {
		const parts = command.split(" ");
		// If the command already contains npx shadcn@latest, just return it
		if (parts[0] === "npx" && parts.length > 1 && parts[1] && parts[1].includes("shadcn")) {
			return command;
		}
		// Otherwise, extract just the component name or command parts
		const componentPart = parts[parts.length - 1];
		const action = parts.length > 1 ? parts[parts.length - 2] : "add";
		return `npx shadcn@latest ${action} ${componentPart}`;
	}, [command]);

	// Auto-run when container becomes ready
	useEffect(() => {
		if (autoRun && containerReady && webContainerSupported && !hasAutoRun.current) {
			hasAutoRun.current = true;
			runCommand();
		}

		// If a command is queued and container becomes ready, execute it
		if (containerReady && queuedCommand.current) {
			const pendingCommand = queuedCommand.current;
			queuedCommand.current = null;
			setIsCommandQueued(false);
			executeCommand(pendingCommand);
		}
	}, [containerReady, webContainerSupported, autoRun]);

	// Update the useEffect for showing logs during web container loading
	useEffect(() => {
		if (
			!containerReady &&
			webContainerSupported &&
			typeof window !== "undefined" &&
			window.webContainerLogs
		) {
			// Set interval to update command output with logs
			const timer = setInterval(() => {
				if (window.webContainerLogs && window.webContainerLogs.length > 0) {
					// Format logs for display
					const formattedLogs = window.webContainerLogs
						.map((log) => `${log.data ? ` ${log.data}` : ""}`)
						.join("");

					// Process logs to clean up repetitive content
					const processedLogs = processTerminalOutput(formattedLogs);

					// Update command output with processed logs
					setCommandOutput(processedLogs);

					// Write to terminal if available
					if (terminalRef.current?.terminal) {
						terminalRef.current.write(`${window.webContainerLogs}`);
					}
				}
			}, TERMINAL_REFRESH_INTERVAL); // Update more frequently for smoother animations

			return () => clearInterval(timer);
		}
	}, [containerReady, webContainerSupported]);

	// Function to update progress message based on logs
	const updateProgress = (logs: string) => {
		if (logs.includes("Installing dependencies")) {
			setProgressMessage("Installing dependencies... This may take several minutes");
		} else if (logs.includes("installing") && !logs.includes("Installing dependencies")) {
			setProgressMessage("Installing components... Please wait");
		} else if (logs.includes("ready to use") || logs.includes("component added")) {
			setProgressMessage("Component added successfully!");
		} else if (logs.includes("copying")) {
			setProgressMessage("Copying component files...");
		} else if (logs.includes("validating")) {
			setProgressMessage("Validating configuration...");
		} else if (logs.includes("added ") && logs.includes("package")) {
			setProgressMessage("Added dependencies successfully!");
		} else if (logs.includes("downloading") || logs.includes("fetching")) {
			setProgressMessage("Downloading packages... Please wait");
		} else if (logs.includes("Booting WebContainer")) {
			setProgressMessage("Starting WebContainer environment...");
		} else if (logs.includes("WebContainer booted")) {
			setProgressMessage("WebContainer environment ready!");
		} else if (logs.includes("Setting up initial file system")) {
			setProgressMessage("Setting up file system...");
		} else if (logs.includes("Pre-loading shadcn template files")) {
			setProgressMessage("Pre-loading template files...");
		}
	};

	// Validate the command format - just basic checks
	const validateCommand = (commandStr: string): string | null => {
		// No real validation needed - we'll let the command run as-is
		if (!commandStr.trim()) {
			return "Please enter a command";
		}
		return null;
	};

	const executeCommand = async (commandToRun: string) => {
		setIsLoading(true);
		setCommandError("");
		setChangedFiles([]);
		setProgressMessage("Starting command execution...");
		setActiveTab("command");

		// Clear the terminal if available
		if (terminalRef.current?.clear) {
			terminalRef.current.clear();
		}

		try {
			// Parse the command into arguments
			const args = commandToRun.trim().split(/\s+/);

			// Track the window logs before running the command
			const logsBefore = window.webContainerLogs ? [...window.webContainerLogs] : [];

			// Set up an interval to update UI with latest logs during execution
			const logUpdateInterval = setInterval(() => {
				if (window.webContainerLogs) {
					const currentLogs = window.webContainerLogs.slice(logsBefore.length);
					const formattedLogs = currentLogs
						.map((log) => `${log.data ? ` ${log.data}` : ""}`)
						.join("");

					// Process logs but preserve animation sequences
					const processedOutput = processTerminalOutput(formattedLogs);
					setCommandOutput(processedOutput || "Command running...");
					updateProgress(formattedLogs);

					// Write directly to the terminal
					if (terminalRef.current?.write && processedOutput) {
						terminalRef.current.write(processedOutput);
					}
				}
			}, TERMINAL_REFRESH_INTERVAL); // Use the faster refresh rate

			// Run the command and get changed files
			const changes = await getContainerManager().runShadcnCommand(args);

			// Clear the interval when done
			clearInterval(logUpdateInterval);

			// Get logs that were added during command execution
			const logsAfter = window.webContainerLogs ? [...window.webContainerLogs] : [];
			const newLogs = logsAfter.slice(logsBefore.length);

			// Format logs for display
			const formattedLogs = newLogs
				.map((log) => {
					// Color coding for logs
					const formattedMsg = `${log.message}`;
					let formattedData = log.data || "";

					// Format prompt outputs and responses
					if (typeof formattedData === "string") {
						if (
							formattedData.includes("Ok to proceed?") ||
							formattedData.includes("Need to install")
						) {
							formattedData = `\x1b[33m${formattedData}\x1b[0m`;
						} else if (formattedData.includes("y\n") || formattedData.includes("responding")) {
							formattedData = `\x1b[32m${formattedData}\x1b[0m`;
						}
					}

					return `${formattedMsg} ${formattedData}`;
				})
				.join("\n");

			// Process terminal output to clean up repetitive messages
			const processedOutput =
				processTerminalOutput(formattedLogs) || "Command completed successfully";
			// setCommandOutput(processedOutput);
			setProgressMessage("Command completed successfully");

			// Final terminal output
			if (terminalRef.current?.write) {
				terminalRef.current.write("\r\n\x1b[32mCommand completed successfully\x1b[0m\r\n");
			}

			if (changes && changes.length > 0) {
				setChangedFiles(changes);
				setActiveTab("files");

				// Call the onExecute callback if provided
				if (onExecute) {
					onExecute(changes);
				}
			} else {
				setActiveTab("command");
			}
		} catch (error) {
			setCommandError(error instanceof Error ? error.message : String(error));
			setProgressMessage("");
			setActiveTab("command");

			// Show error in terminal
			if (terminalRef.current?.write) {
				terminalRef.current.write(
					`\r\n\x1b[31mError: ${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const runCommand = async () => {
		if (!webContainerSupported) {
			setCommandError("WebContainer is not supported in this environment");
			return;
		}

		// Validate the command first
		const validationError = validateCommand(command);
		if (validationError) {
			setCommandError(validationError);
			return;
		}

		// If container isn't ready yet, queue the command
		if (!containerReady) {
			setIsCommandQueued(true);
			queuedCommand.current = makeCommand();
			setProgressMessage("Command queued. Waiting for WebContainer to initialize...");
			return;
		}

		try {
			// Set loading state for file importing
			setIsLoadingFiles(true);
			setLoadingMessage("Importing project files...");

			// Import necessary project files before running the command
			await getContainerManager().importProjectFiles();

			setLoadingMessage("Running shadcn command...");
			setIsLoadingFiles(false);
			setIsLoading(true);

			const cmd = makeCommand();
			setCommand(cmd);

			// If container is ready, execute the command immediately
			await executeCommand(cmd);
		} catch (error) {
			console.error("Error running command", error);
			setCommandError(
				error instanceof Error
					? error.message
					: "An unknown error occurred during command execution"
			);

			// Show error in terminal
			if (terminalRef.current?.write) {
				terminalRef.current.write(
					`\r\n\x1b[31mError: ${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`
				);
			}
		} finally {
			setIsLoading(false);
			setIsLoadingFiles(false);
		}
	};

	return (
		<div className="w-full">
			<div className="space-y-4">
				<div className="flex flex-col gap-3">
					<div className="relative flex w-full items-center">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<TerminalIcon className="h-4 w-4 text-muted-foreground" />
						</div>
						<Input
							className="pl-10 pr-20 font-mono text-sm h-12 bg-muted/40 border-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
							placeholder="npx shadcn@latest add button"
							value={command}
							onChange={(e) => setCommand(e.target.value)}
							disabled={isLoading || isLoadingFiles}
						/>
						<Button
							onClick={runCommand}
							disabled={isLoading || !webContainerSupported || isLoadingFiles}
							className="absolute right-1 px-4 py-1 h-10"
							size="sm"
							variant={isLoading || isCommandQueued || isLoadingFiles ? "outline" : "default"}
						>
							{isLoading ? (
								<span className="flex items-center">
									<span className="animate-spin mr-2 h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
									Running
								</span>
							) : isLoadingFiles ? (
								<span className="flex items-center">
									<span className="animate-spin mr-2 h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
									Loading
								</span>
							) : isCommandQueued ? (
								<span className="flex items-center">
									<span className="animate-pulse mr-2">⏱️</span>
									Queued
								</span>
							) : (
								"Run"
							)}
						</Button>
					</div>

					{!containerReady && webContainerSupported && (
						<div className="text-xs text-muted-foreground">
							<span className="animate-pulse">⏳</span> WebContainer initializing...{" "}
							{isCommandQueued
								? "(Your command will run automatically when ready)"
								: "You can type your command now"}
						</div>
					)}
				</div>

				{isLoadingFiles && (
					<div className="flex items-center justify-center p-3 bg-muted/30 rounded-md text-sm text-muted-foreground border border-dashed">
						<div className="animate-spin mr-2 h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
						<span>{loadingMessage}</span>
					</div>
				)}

				{(isLoading || isCommandQueued) && progressMessage && (
					<div className="flex items-center justify-center p-3 bg-muted/30 rounded-md text-sm text-muted-foreground border border-dashed">
						{isLoading && (
							<div className="animate-spin mr-2 h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
						)}
						{isCommandQueued && <span className="animate-pulse mr-2">⏱️</span>}
						<span>{progressMessage}</span>
					</div>
				)}

				{commandError && (
					<Alert variant="destructive" className="mt-2">
						<AlertTriangleIcon className="h-4 w-4" />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>
							<pre className="mt-1 w-full whitespace-pre-wrap font-mono text-xs">
								{commandError}
							</pre>
						</AlertDescription>
					</Alert>
				)}

				{(commandOutput || changedFiles.length > 0) && (
					<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="command" className="text-xs">
								<InfoIcon className="h-3 w-3 mr-2" />
								Terminal Output
							</TabsTrigger>
							<TabsTrigger value="files" disabled={changedFiles.length === 0} className="text-xs">
								<FileIcon className="h-3 w-3 mr-2" />
								Changed Files {changedFiles.length > 0 && `(${changedFiles.length})`}
							</TabsTrigger>
						</TabsList>
						<TabsContent value="command" className="mt-2">
							<div className="w-full p-0 bg-black rounded-md text-white overflow-hidden h-[300px] font-mono text-sm">
								<XTermComponent initialText={commandOutput} ref={terminalRef} />
							</div>
						</TabsContent>
						<TabsContent value="files" className="mt-2 max-h-[300px] overflow-auto">
							<FileChangeDisplay changedFiles={changedFiles} onDownloadAll={() => { }} />
						</TabsContent>
					</Tabs>
				)}

				{changedFiles.length > 0 && (
					<div className="mt-4">
						<GitHubIntegration changedFiles={changedFiles} disabled={isLoading} />
					</div>
				)}
			</div>
		</div>
	);
};
