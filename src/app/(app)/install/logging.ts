/**
 * Simple logging utility for the install feature
 * Works on both client and server
 */

/**
 * Log an informational message to the console
 * @param message Main message to log
 * @param details Optional details object or message
 */
export function logInfo(message: string, details?: unknown): void {
	if (details) {
		console.info(`[Install] ${message}:`, details);
	} else {
		console.info(`[Install] ${message}`);
	}

	// Store logs in global variable for display in UI if in browser
	appendToLogHistory("info", message, details);
}

/**
 * Log a warning message to the console
 * @param message Main message to log
 * @param details Optional details object or message
 */
export function logWarning(message: string, details?: unknown): void {
	if (details) {
		console.warn(`[Install] ${message}:`, details);
	} else {
		console.warn(`[Install] ${message}`);
	}

	// Store logs in global variable for display in UI if in browser
	appendToLogHistory("warning", message, details);
}

/**
 * Log an error message to the console
 * @param message Main message to log
 * @param details Optional details object or message
 */
export function logError(message: string, details?: unknown): void {
	if (details) {
		console.error(`[Install] ${message}:`, details);
	} else {
		console.error(`[Install] ${message}`);
	}

	// Store logs in global variable for display in UI if in browser
	appendToLogHistory("error", message, details);
}

/**
 * Append a log entry to the global log history
 */
function appendToLogHistory(
	type: "info" | "warning" | "error",
	message: string,
	data?: unknown
): void {
	if (typeof window !== "undefined") {
		if (!window.webContainerLogs) {
			window.webContainerLogs = [];
		}

		window.webContainerLogs.push({
			type,
			message,
			data,
			timestamp: new Date().toISOString(),
		});
	}
}
