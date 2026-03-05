import fs from "fs/promises";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import path from "path";
import { BINARY_EXTENSIONS, fileContentCache, getContentType, sanitizePath } from "../utils";

// Use a more specific template directory path that only includes necessary files
// This prevents including the entire codebase in the serverless function
const TEMPLATE_SPECIFIC_DIR = path.join("packages", "create-shipkit-app", "templates", "minimal");

/**
 * API route to get file content from the server filesystem
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const filePath = searchParams.get("path");

		if (!filePath) {
			return NextResponse.json({ error: "Path parameter is required" }, { status: 400 });
		}

		// Log the request path for debugging
		console.log(`File content request for: "${filePath}"`);

		// Check cache first
		if (fileContentCache.has(filePath)) {
			console.log(`Using cached file content for: ${filePath}`);
			const { content, contentType } = fileContentCache.get(filePath)!;
			const body: BodyInit = typeof content === "string" ? content : new Uint8Array(content);
			return new NextResponse(body, {
				headers: {
					"Content-Type": contentType,
				},
			});
		}

		// Sanitize the file path to prevent directory traversal attacks
		const sanitizedPath = sanitizePath(filePath);

		// Use the specific template directory instead of potentially the entire project
		const resolvedPath = path.join(process.cwd(), TEMPLATE_SPECIFIC_DIR, sanitizedPath);

		// Log the resolved path for debugging
		console.log(`Accessing file from: ${resolvedPath}`);

		// Ensure the path is within the allowed template directory
		const templateDirFullPath = path.join(process.cwd(), TEMPLATE_SPECIFIC_DIR);
		if (!resolvedPath.startsWith(templateDirFullPath)) {
			console.warn(`Attempted access to file outside template directory: ${resolvedPath}`);
			return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
		}

		// Check if the file exists
		try {
			const stats = await fs.stat(resolvedPath);
			if (!stats.isFile()) {
				return NextResponse.json({ error: "Not a file" }, { status: 400 });
			}
		} catch (error) {
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}

		// Determine if this is a binary file
		const extension = path.extname(resolvedPath).toLowerCase();
		const isBinary = BINARY_EXTENSIONS.includes(extension);

		// Read the file
		const content = isBinary
			? await fs.readFile(resolvedPath) // Binary files as Buffer
			: await fs.readFile(resolvedPath, "utf-8"); // Text files as UTF-8

		// Get content type based on file extension
		const contentType = getContentType(extension);

		// Cache the file content
		fileContentCache.set(filePath, { content, contentType });

		// Return file content
		const body: BodyInit = typeof content === "string" ? content : new Uint8Array(content);
		return new NextResponse(body, {
			headers: {
				"Content-Type": contentType,
			},
		});
	} catch (error) {
		console.error("Error accessing file:", error);
		return NextResponse.json(
			{
				error: "Failed to access file",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
