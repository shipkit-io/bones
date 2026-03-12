/// <reference lib="webworker" />

const API_URL = process.env.NEXT_PUBLIC_LOGGER_URL || "https://log.bones.sh/v1";

interface LogData {
	level: "info" | "warn" | "error";
	message: string;
	timestamp: number;
	metadata?: Record<string, unknown>;
}

/**
 * Logger Worker
 * This worker handles logging operations in batches to reduce API calls.
 * It will automatically flush logs every 5 seconds or when reaching batch size.
 */

const logQueue: LogData[] = [];
const MAX_BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000; // 5 seconds

const flushLogs = async (): Promise<void> => {
	if (logQueue.length === 0) {
		return;
	}

	const logsToSend = logQueue.splice(0, MAX_BATCH_SIZE);
	try {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(logsToSend),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	} catch (error) {
		// Re-add failed logs to the front of the queue
		logQueue.unshift(...logsToSend);
	}
};

// Set up periodic flush
setInterval(flushLogs, FLUSH_INTERVAL);

self.addEventListener("message", (event: MessageEvent<{ logData: LogData }>) => {
	const { logData } = event.data;
	logQueue.push(logData);

	// Flush immediately if we've reached batch size
	if (logQueue.length >= MAX_BATCH_SIZE) {
		void flushLogs();
	}
});
