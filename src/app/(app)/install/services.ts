"use server";

import { existsSync } from "fs";
import { join } from "path";

// Detect whether the project uses /app or /src/app structure
export async function detectDirectoryStructure(): Promise<string> {
	try {
		// Check if src/app exists
		const srcAppPath = join(process.cwd(), "src", "app");
		if (existsSync(srcAppPath)) {
			return "src/app";
		}

		// Check if app exists
		const appPath = join(process.cwd(), "app");
		if (existsSync(appPath)) {
			return "app";
		}

		// Default to src/app if neither exists
		return "src/app";
	} catch (error) {
		console.error("Error detecting directory structure:", error);
		// Default to src/app if there's an error
		return "src/app";
	}
}
