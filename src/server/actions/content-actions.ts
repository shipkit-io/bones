"use server";

import fs from "fs/promises";
import path from "path";
import { getContentHistory, revertSection, trackContentChanges } from "../services/content-history-service";
import { commitFileChange } from "../services/git-service";

interface SaveContentOptions {
	createPR?: boolean;
	prTitle?: string;
	prBody?: string;
}

/**
 * Save content to a source file and commit changes
 */
export async function saveContent(
	fileName: string,
	content: string,
	options: SaveContentOptions = {}
) {
	try {
		// Get the absolute path to the source file
		const filePath = path.join(process.cwd(), fileName);

		// Write the content to the file
		await fs.writeFile(filePath, content, "utf-8");

		// Track content changes
		await trackContentChanges(filePath, content);

		// Commit the changes
		const relativePath = path.relative(process.cwd(), filePath);
		await commitFileChange(relativePath, {
			message: `update content: ${fileName}`,
			createPR: options.createPR,
			prTitle: options.prTitle,
			prBody: options.prBody,
		});
	} catch (error) {
		console.error("Error saving content:", error);
		throw new Error("Failed to save content");
	}
}

/**
 * Read content from a source file
 */
export async function readContent(fileName: string) {
	try {
		const filePath = path.join(process.cwd(), "src", fileName);
		const content = await fs.readFile(filePath, "utf-8");
		return content;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return "";
		}
		console.error("Error reading content:", error);
		throw new Error("Failed to read content");
	}
}

/**
 * Get content history for a file
 */
export async function getHistory(fileName: string) {
	const filePath = path.join(process.cwd(), "src", fileName);
	return getContentHistory(filePath);
}

/**
 * Revert a section to its original content
 */
export async function revertContentSection(fileName: string, sectionId: string) {
	const filePath = path.join(process.cwd(), "src", fileName);
	return revertSection(filePath, sectionId);
}
