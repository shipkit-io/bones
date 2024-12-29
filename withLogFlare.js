/* eslint-env node */
import fs from "fs";
import path from "path";
import util from "util";
// import { otelLogger } from './otel-logger.js';

const API_URL = process.env.NEXT_PUBLIC_LOGGER_URL || "https://log.bones.sh/v1";

// Add this near the top of the file after other imports
const getNextVersion = () => {
	try {
		const packageJson = JSON.parse(
			fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
		);
		// Get major version number from dependencies or devDependencies
		const nextVersion = (
			packageJson.dependencies?.next ||
			packageJson.devDependencies?.next ||
			""
		)
			.replace(/[\^~]/g, "") // Remove ^ or ~ from version
			.split(".")[0]; // Get major version number
		return Number.parseInt(nextVersion, 10);
	} catch (error) {
		// console.warn("Could not determine Next.js version:", error);
		return -1; // Return -1 to disable instrumentationHook by default if version can't be determined
	}
};

/**
 * @typedef {'debug' | 'info' | 'warn' | 'error' | 'log' | string} LogLevel
 */
/** @type {LogLevel[]} */
export const logLevels = ["debug", "info", "warn", "error", "log"];

/**
 * @typedef {Object} LogFlareOptions
 * @property {string} [apiUrl] - The URL of the LogFlare API
 * @property {string} [apiKey] - Your LogFlare API Key
 * @property {string} [prefix='> '] - Prefix for log messages
 * @property {LogLevel} [logLevel='info'] - Minimum log level to display
 * @property {boolean} [logToFile=process.env.NODE_ENV === 'production'] - Whether to log to a file
 * @property {string} [logFilePath] - Path to the log file
 * @property {boolean} [useColors=true] - Whether to use colors in console output
 * @property {boolean} [useEmoji=true] - Whether to use emojis in console output
 * @property {Object.<LogLevel, string>} [colors] - Custom colors for each log level
 * @property {Object.<LogLevel, string>} [emojis] - Custom emojis for each log level
 */

/**
 * @typedef {Object} LogData
 * @property {string} timestamp - Timestamp of the log
 * @property {LogLevel} level - Log level
 * @property {string} message - Log message
 * @property {Object} metadata - Metadata for the log
 * @property {string} [emoji] - Emoji for the log level (optional)
 * @property {string} [prefix] - Prefix for the log message (optional)
 */

/**
 * Default settings for the logger
 * @type {Object.<string, Object.<LogLevel, string>>}
 */
const defaultSettings = {
	colors: {
		debug: "\x1b[36m", // Cyan
		info: "\x1b[32m", // Green
		warn: "\x1b[33m", // Yellow
		error: "\x1b[31m", // Red
	},
	emojis: {
		debug: "🐛",
		info: "ℹ️ ",
		warn: "⚠️ ",
		error: "🚨",
	},
};

// Add this at the top of the file after imports
let isInitialized = false;

/**
 * Wraps the Next.js config to add logging functionality
 * @param {LogFlareOptions | string} options - Configuration options for the logger
 * @returns {function(import('next').NextConfig): import('next').NextConfig}
 */
export const withLogFlare = (options = {}) => {
	return (nextConfig) => {
		// Return early if already initialized
		// if (isInitialized) {
		// 	return nextConfig;
		// }

		// Allow for a single string API key to be passed in
		const opts = typeof options === "string" ? { apiKey: options } : options;

		// Default options
		const {
			apiKey = process.env.NEXT_PUBLIC_LOGFLARE_KEY,
			prefix = "> ",
			logLevel = "log",
			logToFile = process.env.NODE_ENV === "production",
			logFilePath = path.join(process.cwd(), "logs", "app.log"),
			useColors = true,
			useEmoji = true,
			colors = {},
			emojis = {},
			apiUrl = API_URL,
		} = opts;

		const currentLogLevelIndex = logLevels.indexOf(logLevel);

		const originalConsole = { ...console }; // Create a copy of the console object

		const mergedColors = { ...defaultSettings.colors, ...colors };
		const mergedEmojis = { ...defaultSettings.emojis, ...emojis };

		let invalidKeyErrorShown = false;

		// Move initialization log after setting up originalConsole
		if (!isInitialized) {
			originalConsole.debug(`Initializing LogFlare with key: ${apiKey}`);
			isInitialized = true;
		}

		/**
		 * Creates a logger function for a specific log level
		 * @param {LogLevel} level - The log level
		 * @returns {function(...any): Promise<void>}
		 */
		const logger =
			(level) =>
			async (...args) => {
				const timestamp = new Date().toISOString();
				const emoji = mergedEmojis[level];
				const formattedArgs = args.map((arg) =>
					typeof arg === "object"
						? util.inspect(arg, { depth: null, colors: false })
						: arg,
				);

				const logMessage = formattedArgs.join(" ");

				const logData = {
					timestamp,
					emoji,
					level,
					prefix,
					message: logMessage,
					metadata: {},
				};

				if (logLevels.indexOf(level) >= currentLogLevelIndex) {
					// Console output with colors and emojis
					let consoleMessage = `${timestamp} [${logData.level}] ${prefix}${logMessage}`;
					if (useEmoji) {
						consoleMessage = `${emoji} ${consoleMessage}`;
					}
					if (useColors) {
						const colorCode = mergedColors[level];
						consoleMessage = `${colorCode}${consoleMessage}\x1b[0m`;
					}

					// Log to console
					originalConsole[level](consoleMessage);

					if (logToFile) {
						fs.appendFileSync(
							logFilePath,
							`${timestamp} [${logData.level}] ${prefix}${logMessage}\n`,
						);
					}

					// otelLogger[level](logMessage, logData);

					// Send log to the API without colors or emojis
					if (apiKey && !invalidKeyErrorShown) {
						try {
							originalConsole.log("Sending log to API:", logData);
							const response = await fetch(apiUrl, {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									...logData,
									api_key: apiKey,
								}),
							});

							if (!response.ok) {
								// throw new Error(`HTTP error! status: ${response.status}`);
								originalConsole.error("Failed to send log to API:", response);
							}
						} catch (error) {
							if (!invalidKeyErrorShown) {
								invalidKeyErrorShown = true;
								originalConsole.warn("Failed to send log to API:", error);
							}
						}
					}
				}
			};

		// Only override console methods once
		console.log = logger("log");
		console.info = logger("info");
		console.warn = logger("warn");
		console.error = logger("error");
		console.debug = logger("debug");

		return {
			...nextConfig,
			experimental: {
				...nextConfig.experimental,
				// ...(getNextVersion() < 15 ? { instrumentationHook: true } : {}),
			},
			// webpack: (config, context) => {
			//   // Handle the webpack configuration here
			//   if (!context.isServer) {
			//     config.resolve.fallback = {
			//       ...config.resolve.fallback,
			//       ws: false, // Set to false instead of using require.resolve
			//     };
			//   }

			//   // Call the original webpack function if it exists
			//   if (typeof nextConfig.webpack === 'function') {
			//     return nextConfig.webpack(config, context);
			//   }

			//   return config;
			// },
		};
	};
};

export default withLogFlare;
