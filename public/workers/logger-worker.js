/// <reference lib="webworker" />
var __awaiter =
	(this && this.__awaiter) ||
	((thisArg, _arguments, P, generator) => {
		function adopt(value) {
			return value instanceof P
				? value
				: new P((resolve) => {
						resolve(value);
					});
		}
		return new (P || (P = Promise))((resolve, reject) => {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	});
const API_URL = process.env.NEXT_PUBLIC_LOGGER_URL || "https://log.bones.sh/v1";
/**
 * Logger Worker
 * This worker handles logging operations in batches to reduce API calls.
 * It will automatically flush logs every 5 seconds or when reaching batch size.
 */
const logQueue = [];
const MAX_BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000; // 5 seconds
const flushLogs = () =>
	__awaiter(void 0, void 0, void 0, function* () {
		if (logQueue.length === 0) {
			return;
		}
		const logsToSend = logQueue.splice(0, MAX_BATCH_SIZE);
		try {
			const response = yield fetch(API_URL, {
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
			console.log(`Logs sent successfully. Status: ${response.status}`);
		} catch (error) {
			console.error("Error sending logs:", error instanceof Error ? error.message : String(error));
			// Re-add failed logs to the front of the queue
			logQueue.unshift(...logsToSend);
		}
	});
// Set up periodic flush
setInterval(flushLogs, FLUSH_INTERVAL);
self.addEventListener("message", (event) => {
	const { logData } = event.data;
	logQueue.push(logData);
	// Flush immediately if we've reached batch size
	if (logQueue.length >= MAX_BATCH_SIZE) {
		void flushLogs();
	}
});
//# sourceMappingURL=logger-worker.js.map
