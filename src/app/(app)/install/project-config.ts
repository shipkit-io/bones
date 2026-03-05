/**
 * Project configuration settings for the installer
 * This centralizes path configurations to avoid hardcoding paths in multiple places
 */

/**
 * File paths configuration
 */
export const ProjectPaths = {
	// Core configuration files
	PACKAGE_JSON: "package.json",
	TSCONFIG_JSON: "tsconfig.json",
	COMPONENTS_JSON: "components.json",
	TAILWIND_CONFIG: "tailwind.config.ts",
	NEXT_CONFIG: "next.config.ts",
	BUN_LOCK: "bun.lockb",

	// Essential style and utility files
	GLOBALS_CSS: "src/styles/globals.css",
	UTILS_TS: "src/lib/utils.ts",

	// Alternative paths for different project structures
	APP_GLOBALS_CSS: "app/styles/globals.css",
	SRC_APP_GLOBALS_CSS: "src/app/styles/globals.css",
	APP_UTILS_TS: "app/lib/utils.ts",
	SRC_APP_UTILS_TS: "src/app/lib/utils.ts",
};

/**
 * Get the essential configuration files for WebContainer
 */
export function getEssentialConfigFiles(): string[] {
	return [
		ProjectPaths.PACKAGE_JSON,
		ProjectPaths.TSCONFIG_JSON,
		ProjectPaths.COMPONENTS_JSON,
		ProjectPaths.TAILWIND_CONFIG,
		ProjectPaths.NEXT_CONFIG,
		ProjectPaths.BUN_LOCK,
		ProjectPaths.GLOBALS_CSS,
		ProjectPaths.UTILS_TS,
	];
}

/**
 * Get all possible paths for a specific file
 * @param fileType The type of file to get alternative paths for
 */
export function getAlternativePaths(fileType: "globals.css" | "utils.ts"): string[] {
	if (fileType === "globals.css") {
		return [
			ProjectPaths.GLOBALS_CSS,
			ProjectPaths.APP_GLOBALS_CSS,
			ProjectPaths.SRC_APP_GLOBALS_CSS,
			"styles/globals.css",
			"src/styles/globals.css",
			"app/globals.css",
			"src/app/globals.css",
		];
	}

	if (fileType === "utils.ts") {
		return [
			ProjectPaths.UTILS_TS,
			ProjectPaths.APP_UTILS_TS,
			ProjectPaths.SRC_APP_UTILS_TS,
			"lib/utils.ts",
			"src/lib/utils.ts",
			"app/lib/utils.ts",
			"src/app/lib/utils.ts",
			"utils/index.ts",
			"src/utils/index.ts",
		];
	}

	return [];
}
