"use client";

import { logInfo } from "./logging";

/**
 * Run an installation command and return the exit code
 * @param container The WebContainer instance
 * @param packageManager The package manager to use (e.g. npm, yarn, bun)
 * @param command The command to run
 * @param displayCommand Optional display command for logging
 * @returns The exit code of the command
 */
export async function runInstallCommand(
	container: any,
	packageManager: string,
	command: string[],
	displayCommand?: string
): Promise<number>;

/**
 * Run an installation command string and return the exit code
 * @param container The WebContainer instance
 * @param commandString The full command string to run
 * @returns The exit code of the command
 */
export async function runInstallCommand(container: any, commandString: string): Promise<number>;

/**
 * Implementation of runInstallCommand that handles both overloads
 */
export async function runInstallCommand(
	container: any,
	packageManagerOrCommandString: string,
	commandArray?: string[],
	displayCommand?: string
): Promise<number> {
	try {
		let packageManager: string = "npx";
		let command: string[] = [];
		let fullCommand: string;

		// Check which overload is being used
		if (commandArray) {
			// First overload: packageManager, command[], displayCommand?
			packageManager = packageManagerOrCommandString;
			command = commandArray;
			fullCommand = displayCommand || `${packageManager} ${command.join(" ")}`;
		} else {
			// Second overload: commandString
			fullCommand = packageManagerOrCommandString;

			// Parse the command string
			const parts = fullCommand.split(" ");
			if (parts.length > 0 && parts[0]) {
				packageManager = parts[0];
				command = parts.slice(1);
			}
		}

		logInfo(`Running command: ${fullCommand}`);

		// Initialize the logs array if it doesn't exist
		if (typeof window !== "undefined" && !window.webContainerLogs) {
			window.webContainerLogs = [];
		}

		// Create a function to log output to both the console and our custom log array
		const logOutput = (message: string, data?: string) => {
			console.log(`${message}${data ? ` ${data}` : ""}`);
			if (typeof window !== "undefined" && window.webContainerLogs) {
				window.webContainerLogs.push({
					type: "info",
					message,
					data,
					timestamp: new Date().toISOString(),
				});
			}
		};

		// Add an initial log entry for the command
		logOutput(`$ ${fullCommand}`, "");

		// Add prompt detection flags
		let needsPromptResponse = false;
		let hasResponded = false;

		// Pre-modify arguments to include --yes flags if possible
		let modifiedArgs = [...command];

		// For NPX commands add the -y flag if not already present
		if (packageManager === "npx" && !command.includes("-y") && !command.includes("--yes")) {
			if (command.some((arg) => arg.includes("shadcn"))) {
				// For shadcn command, add it as the first argument
				modifiedArgs = ["-y", ...command];
				logOutput("Added automatic -y flag to shadcn command", "");
			}
		}

		// Start the process
		const process = await container.spawn(packageManager, modifiedArgs);

		// Set up process logging
		const outputStream = new WritableStream({
			write(data) {
				logOutput("", data);

				// Check if this output contains a prompt that needs a response
				if (
					data.includes("Ok to proceed?") ||
					data.includes("Need to install") ||
					data.includes("(y)") ||
					data.includes("(Y/n)") ||
					data.includes("(y/N)")
				) {
					needsPromptResponse = true;

					// Respond with a slight delay to ensure the prompt is fully processed
					setTimeout(() => {
						if (!hasResponded) {
							try {
								logOutput("Auto-responding with 'y' to prompt", "");
								process.input.write("y\n");
								hasResponded = true;
								logOutput("", "y");
							} catch (error) {
								logOutput("Failed to respond to prompt", String(error));
							}
						}
					}, 100);
				}
			},
		});

		process.output.pipeTo(outputStream);

		// Also set up auto-response on a timer as a fallback
		const promptCheckTimer = setInterval(() => {
			if (needsPromptResponse && !hasResponded) {
				try {
					logOutput("Auto-responding with 'y' (timer-based)", "");
					process.input.write("y\n");
					hasResponded = true;
					logOutput("", "y");
				} catch (error) {
					logOutput("Failed to respond to prompt (timer-based)", String(error));
				}
			}
		}, 1000);

		// Wait for process to exit
		const exitCode = await process.exit;

		// Clear the timer
		clearInterval(promptCheckTimer);

		logInfo(`Command exited with code ${exitCode}`);

		return exitCode;
	} catch (error) {
		logInfo("Error running installation command", error);
		return 1; // Return error code
	}
}

/**
 * Processes terminal output to remove redundant progress lines
 * Consolidates similar consecutive progress indicators into a single line
 * Preserves ANSI control sequences for proper terminal rendering
 */
export function processTerminalOutput(output: string): string {
	if (!output) return "";
	return output;

	// Skip any debug logging messages about ANSI sequences
	const cleanedOutput = output
		.split("\n")
		.filter((line) => {
			return (
				!line.includes("Detected ANSI control sequence") &&
				!line.includes("not considering as completion")
			);
		})
		.join("\n");

	// Remove repetitive command output prefixes
	const withoutPrefixes = cleanedOutput.replace(/^npx .+ output:\s*/gm, "");

	// Remove excessive empty lines
	const withoutExcessiveEmptyLines = withoutPrefixes.replace(/\n\s*\n\s*\n+/g, "\n\n");

	return withoutExcessiveEmptyLines;
}
