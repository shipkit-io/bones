import {
	bold,
	green,
	magenta,
	red,
	white,
	yellow,
} from "@/lib/utils/pico-colors";
import { type LogData, type LogLevel } from "@/types/logger";

// let loggerWorker: Worker | null = null;

// if (typeof window !== "undefined" && window.Worker) {
// 	// Initialize the worker in the browser environment
// 	loggerWorker = new Worker(
// 		new URL(routes.workers.logger, window.location.origin),
// 	);
// }

const isServer = typeof window === "undefined";

const createLogger =
	(level: LogLevel) =>
	(...args: unknown[]): void => {
		const logData: LogData = {
			apiKey: process.env.NEXT_PUBLIC_LOGFLARE_KEY,
			prefix: "logger",
			emoji: "🌐",
			level,
			message: args
				.map((arg) =>
					typeof arg === "object" ? JSON.stringify(arg) : String(arg),
				)
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

/* From the Next.js source code https://github.com/vercel/next.js/blob/canary/packages/next/lib/console.ts */
export const prefixes = {
	wait: white(bold("○")),
	error: red(bold("⨯")),
	warn: yellow(bold("⚠")),
	ready: "▲", // no color
	info: white(bold(" ")),
	event: green(bold("✓")),
	trace: magenta(bold("»")),
} as const;

const LOGGING_METHOD = {
	log: "log",
	warn: "warn",
	error: "error",
} as const;

function prefixedLog(prefixType: keyof typeof prefixes, ...message: any[]) {
	if ((message[0] === "" || message[0] === undefined) && message.length === 1) {
		message.shift();
	}

	const consoleMethod: keyof typeof LOGGING_METHOD =
		prefixType in LOGGING_METHOD
			? LOGGING_METHOD[prefixType as keyof typeof LOGGING_METHOD]
			: "log";

	const prefix = prefixes[prefixType];
	// If there's no message, don't print the prefix but a new line
	if (message.length === 0) {
		console[consoleMethod]("");
	} else {
		console[consoleMethod](` ${prefix}`, ...message);
	}
}

export function bootstrap(...message: any[]) {
	console.log(" ", ...message);
}

export function wait(...message: any[]) {
	prefixedLog("wait", ...message);
}

export function error(...message: any[]) {
	prefixedLog("error", ...message);
}

export function warn(...message: any[]) {
	prefixedLog("warn", ...message);
}

export function ready(...message: any[]) {
	prefixedLog("ready", ...message);
}

export function info(...message: any[]) {
	prefixedLog("info", ...message);
}

export function event(...message: any[]) {
	prefixedLog("event", ...message);
}

export function trace(...message: any[]) {
	prefixedLog("trace", ...message);
}

const warnOnceMessages = new Set();
export function warnOnce(...message: any[]) {
	if (!warnOnceMessages.has(message[0])) {
		warnOnceMessages.add(message.join(" "));

		warn(...message);
	}
}
