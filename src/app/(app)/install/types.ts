/**
 * A file to be processed by the container
 */
export interface ContainerFile {
	path: string;
	content: string;
}

/**
 * Log entry type for the container logs
 */
export interface LogEntry {
	type: "info" | "warning" | "error";
	message: string;
	data?: any;
	timestamp: string;
}

// Add this to TypeScript global declarations
declare global {
	interface Window {
		webContainerLogs?: LogEntry[];
	}
}
