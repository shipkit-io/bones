import { loadEnvConfig } from "@next/env";
import { logger } from "@/lib/logger";

/**
 * Load environment variables from .env* files using @next/env
 * This is especially useful in build scripts or tests outside of the Next.js runtime
 * where Next.js doesn't automatically load the environment
 */
export function loadEnvironment(isDev = process.env.NODE_ENV !== "production") {
	try {
		const projectDir = process.cwd();
		const { combinedEnv, loadedEnvFiles } = loadEnvConfig(projectDir, isDev);

		if (loadedEnvFiles.length > 0) {
			logger.debug(`Loaded environment from ${loadedEnvFiles.length} files`);

			// Log file names in debug mode
			loadedEnvFiles.forEach((file) => {
				logger.debug(`Loaded env file: ${file.path}`);
			});

			// Return the combined environment
			return combinedEnv;
		}
		logger.warn("No environment files loaded");
		return null;
	} catch (error) {
		logger.error("Failed to load environment:", error);
		return null;
	}
}

/**
 * Get an environment variable with a fallback value
 * This handles the common pattern of checking if an env var exists and using a default if not
 */
export function getEnvVar(name: string, defaultValue = ""): string {
	return process.env[name] || defaultValue;
}

/**
 * Get a boolean environment variable
 * This handles the common pattern of converting string env vars to booleans
 */
export function getBooleanEnvVar(name: string, defaultValue = false): boolean {
	const value = process.env[name];
	if (value === undefined) return defaultValue;
	return value === "true" || value === "1";
}

/**
 * Get a numeric environment variable
 * This handles the common pattern of converting string env vars to numbers
 */
export function getNumericEnvVar(name: string, defaultValue = 0): number {
	const value = process.env[name];
	if (value === undefined) return defaultValue;

	const parsed = Number(value);
	return Number.isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Check if an environment feature flag is enabled
 * This is a utility for the common pattern of checking feature flags
 */
export function isFeatureEnabled(featureName: string, defaultValue = false): boolean {
	return getBooleanEnvVar(`FEATURE_${featureName.toUpperCase()}_ENABLED`, defaultValue);
}
