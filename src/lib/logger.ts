import { green, magenta, red, white, yellow } from "@/lib/utils/pico-colors";
import type { LogData, LogLevel } from "@/types/logger";

// let loggerWorker: Worker | null = null;

// if (typeof window !== "undefined" && window.Worker) {
// 	// Initialize the worker in the browser environment
// 	loggerWorker = new Worker(
// 		new URL(routes.workers.logger, window.location.origin),
// 	);
// }

const isServer = typeof window === "undefined";

const _createLogger =
	(level: LogLevel) =>
		(...args: unknown[]): void => {
			const logData: LogData = {
				apiKey: process.env.NEXT_PUBLIC_LOGFLARE_KEY,
				prefix: "logger",
				emoji: "🌐",
				level,
				message: args
					.map((arg) => {
						if (arg === null) return "null";
						if (arg === undefined) return "undefined";
						if (typeof arg === "string") return arg;
						if (typeof arg === "number") return arg.toString();
						if (typeof arg === "boolean") return arg.toString();
						if (typeof arg === "bigint") return arg.toString();
						if (typeof arg === "symbol") return arg.toString();
						if (typeof arg === "function") return "[Function]";
						// Must be an object at this point
						try {
							return JSON.stringify(arg);
						} catch {
							return "[Object]";
						}
					})
					.join(" "),
				timestamp: new Date().toISOString(),
				url: isServer ? "server" : window.location.href,
				userAgent: isServer ? "server" : navigator.userAgent,
			};

			// Send server-side logs to your logging service or database
			void fetch("http://localhost:3000/v1", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(logData),
			});
			if (isServer) {
				console[level](...args);

				// TODO: Implement logging service
				if (logData?.apiKey) {
					// Send server-side logs to your logging service or database
					void fetch("http://localhost:3000/v1", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(logData),
					});
				}
			} else {
				console[level](...args);
				// if (loggerWorker) {
				// 	loggerWorker.postMessage({ logData });
				// }
			}
		};

export const logger = console;
// export const logger = {
// 	info: createLogger("info"),
// 	warn: createLogger("warn"),
// 	error: createLogger("error"),
// 	debug: createLogger("debug"),
// 	log: createLogger("log"),
// };

/* Start of Logger */
// import { type ILogObj, Logger } from "tslog";
// export const logger = new Logger<ILogObj>({
//   name: "logger",
// });

// export const middlewareLogger = logger.getSubLogger({
//   name: "middleware",
//   hideLogPositionForProduction: true,
// });
/* End of Logger */

const prefixes = {
	info: white("ℹ"),
	warn: yellow("⚠"),
	error: red("✖"),
	wait: magenta("○"),
	ready: green("✓"),
	event: magenta("◆"),
	trace: white("›"),
} as const;

const LOGGING_METHOD = {
	info: "info",
	warn: "warn",
	error: "error",
	wait: "info",
	ready: "info",
	event: "info",
	trace: "trace",
} as const;

type PrefixType = keyof typeof prefixes;
type LoggingMethod = keyof typeof LOGGING_METHOD;

function prefixedLog(prefixType: PrefixType, ...message: unknown[]) {
	if ((message[0] === "" || message[0] === undefined) && message.length === 1) {
		message.shift();
	}

	const consoleMethod: LoggingMethod =
		prefixType in LOGGING_METHOD ? LOGGING_METHOD[prefixType] : "info";

	const prefix = prefixes[prefixType];
	// If there's no message, don't print the prefix but a new line
	if (message.length === 0) {
		console[consoleMethod]("");
	} else {
		console[consoleMethod](` ${prefix}`, ...message);
	}
}

export function info(...message: unknown[]) {
	prefixedLog("info", ...message);
}

export function warn(...message: unknown[]) {
	prefixedLog("warn", ...message);
}

export function error(...message: unknown[]) {
	prefixedLog("error", ...message);
}

export function wait(...message: unknown[]) {
	prefixedLog("wait", ...message);
}

export function ready(...message: unknown[]) {
	prefixedLog("ready", ...message);
}

export function event(...message: unknown[]) {
	prefixedLog("event", ...message);
}

export function trace(...message: unknown[]) {
	prefixedLog("trace", ...message);
}

const warnOnceMessages = new Set();

export function warnOnce(...message: unknown[]) {
	const key = JSON.stringify(message);
	if (!warnOnceMessages.has(key)) {
		warnOnceMessages.add(key);
		warn(...message);
	}
}

export function panic(...message: unknown[]) {
	error(...message);
	process.exit(1);
}
