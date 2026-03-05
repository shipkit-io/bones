import fs from "fs/promises";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import path from "path";
import { directoryCache, sanitizePath, TEMPLATE_BASE_DIR } from "../utils";

// Use a more specific template directory path that only includes necessary files
// This prevents including the entire codebase in the serverless function
const TEMPLATE_SPECIFIC_DIR = path.join("packages", "create-shipkit-app", "templates", "minimal");

/**
 * Get all files in a directory with caching
 */
async function getDirectoryContents(directoryPath: string) {
	try {
		// Check cache first
		if (directoryCache.has(directoryPath)) {
			console.log(`Using cached directory listing for: ${directoryPath}`);
			return directoryCache.get(directoryPath) || [];
		}

		// Use the specific template directory instead of potentially the entire project
		const fullPath = path.join(process.cwd(), TEMPLATE_SPECIFIC_DIR, directoryPath);

		// Log the resolved path for debugging
		console.log(`Reading directory from: ${fullPath}`);

		try {
			const entries = await fs.readdir(fullPath, { withFileTypes: true });

			// Map entries to consistent format
			const mappedEntries = entries.map((entry) => ({
				name: entry.name,
				isDirectory: entry.isDirectory(),
			}));

			// Cache the result
			directoryCache.set(directoryPath, mappedEntries);

			return mappedEntries;
		} catch (readError) {
			console.warn(`Directory not found: ${fullPath}`, readError);
			// Return empty array for non-existent directories
			return [];
		}
	} catch (error) {
		console.error(`Error reading directory: ${directoryPath}`, error);
		return [];
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		let dirPath = searchParams.get("path") || "";

		// Sanitize the path to prevent directory traversal attacks
		dirPath = sanitizePath(dirPath);

		// Log all requests for debugging
		console.log(`Directory listing request for path: "${dirPath}"`);

		const entries = await getDirectoryContents(dirPath);

		// Log the response for debugging
		console.log(`Returning ${entries.length} entries for path: "${dirPath}"`);

		return NextResponse.json(entries);
	} catch (error) {
		console.error("Error listing template files:", error);
		return NextResponse.json({ error: "Failed to list template files" }, { status: 500 });
	}
}
