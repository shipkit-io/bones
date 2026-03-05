import { fileURLToPath } from "node:url";
import fs from "fs";
import type { NextConfig } from "next";
import path from "path";
import { PLUGINS_DIR_URL } from "./nextjs";

/**
 * Applies configuration plugins found in a specified directory to a Next.js config object.
 *
 * @param initialConfig The initial Next.js configuration object.
 * @param pluginsRelativeDir The directory path relative to the project root where plugins are located.
 * @returns The modified Next.js configuration object with plugins applied.
 */
export function withPlugins(initialConfig: NextConfig, pluginsRelativeDir?: string): NextConfig {
	let config = { ...initialConfig };
	const pluginsDir = pluginsRelativeDir
		? path.join(process.cwd(), pluginsRelativeDir)
		: fileURLToPath(PLUGINS_DIR_URL);

	try {
		if (fs.existsSync(pluginsDir)) {
			const pluginFiles = fs
				.readdirSync(pluginsDir)
				.filter(
					(file) =>
						/\.(t|j|mj|mt)s$/.test(file) &&
						!["index.ts", "index.js", "index.mts", "index.mjs", "index.cjs"].includes(file)
				)
				.sort(); // Apply plugins in alphabetical order

			// Logging moved to instrumentation.ts

			for (const file of pluginFiles) {
				const pluginPath = path.join(pluginsDir, file);
				try {
					const pluginModule = require(pluginPath);
					// Find the exported function (prefer default export, fallback to the first named export function)
					let pluginFunction = pluginModule.default;
					if (typeof pluginFunction !== "function") {
						pluginFunction = Object.values(pluginModule).find(
							(exp): exp is (config: NextConfig) => NextConfig => typeof exp === "function"
						);
					}

					if (typeof pluginFunction === "function") {
						// console.debug(`[Next.js Config] Applying plugin: ${file}`); // Keep apply log here
						config = pluginFunction(config);
					} else {
						throw new Error(
							`[Next.js Config] Skipping ${file}: No exported function found or the export is not a function.`
						);
					}
				} catch (error) {
					console.debug(`[Next.js Config] Error loading or applying plugin ${file}:`, error);
				}
			}
		} else {
			// This condition is logged in instrumentation.ts now
			// console.log(`[Next.js Config] Plugin directory not found, skipping dynamic plugins: ${relativePluginsDirLog}`);
		}
	} catch (error) {
		console.error("[Next.js Config] Error reading plugin directory:", error);
	}

	return config;
}
