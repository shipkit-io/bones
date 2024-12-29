/// <reference lib="webworker" />

const API_URL = process.env.NEXT_PUBLIC_LOGGER_URL || "https://log.bones.sh/v1";

/**
 * Logger Worker
 * This worker handles logging operations in batches to reduce API calls.
 */

const logQueue: any[] = [];
const MAX_BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000; // 5 seconds

const flushLogs = (): void => {
	if (logQueue.length === 0) {
		return;
	}

	const logsToSend = logQueue.splice(0, MAX_BATCH_SIZE);
	fetch(API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(logsToSend),
	})
		.then(async (response) => {
			console.log("Logs sent:", response.statusText, response);
		})
		.catch((error: Error) => console.error("Error sending logs:", error));
	console.log("Flushed logs:", logsToSend);
};

setInterval(flushLogs, FLUSH_INTERVAL);

self.addEventListener("message", (event: MessageEvent) => {
	const { logData } = event.data;
	logQueue.push(logData);
	flushLogs();

	if (logQueue.length >= MAX_BATCH_SIZE) {
		flushLogs();
	}
});
