"use server";

import JSZip from "jszip";
import { detectDirectoryStructure } from "./services";

// Process v0 import - just fetches the project structure
// Actual component processing happens client-side with WebContainers
export async function getProjectStructure(): Promise<string> {
	try {
		// Detect project structure
		const projectStructure = await detectDirectoryStructure();
		return projectStructure;
	} catch (error) {
		console.error("Error detecting project structure:", error);
		// Default to src/app if there's an error
		return "src/app";
	}
}

// Create a ZIP file with all component files
export async function downloadFiles(files: { path: string; content: string }[]): Promise<Blob> {
	const zip = new JSZip();

	// Using for...of instead of forEach to fix linter error
	for (const file of files) {
		zip.file(file.path, file.content);
	}

	return await zip.generateAsync({ type: "blob" });
}
