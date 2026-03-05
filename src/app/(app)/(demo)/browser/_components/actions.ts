"use server";

import { promises as fs } from "fs";
import { revalidatePath } from "next/cache";
import path from "path";
import type { FileNode } from "./file-browser";

const ROOT_DIR = process.cwd();

async function buildFileTree(dir: string, relativePath = ""): Promise<FileNode[]> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const nodes: FileNode[] = [];

	for (const entry of entries) {
		// Skip node_modules and .git directories
		if (entry.name === "node_modules" || entry.name === ".git") {
			continue;
		}

		const currentPath = path.join(relativePath, entry.name);
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			const children = await buildFileTree(fullPath, currentPath);
			nodes.push({
				name: entry.name,
				path: currentPath,
				type: "directory",
				children,
			});
		} else {
			const stats = await fs.stat(fullPath);
			nodes.push({
				name: entry.name,
				path: currentPath,
				type: "file",
				size: stats.size,
				modifiedAt: stats.mtime.toISOString(),
			});
		}
	}

	return nodes.sort((a, b) => {
		if (a.type === "directory" && b.type === "file") return -1;
		if (a.type === "file" && b.type === "directory") return 1;
		return a.name.localeCompare(b.name);
	});
}

export async function getFileTree() {
	try {
		const tree = await buildFileTree(ROOT_DIR);
		revalidatePath("/browser");
		return { tree };
	} catch (error) {
		return { error: "Failed to load file tree" };
	}
}

export async function getFileStats(filePath: string) {
	try {
		const fullPath = path.join(ROOT_DIR, filePath);
		const stats = await fs.stat(fullPath);

		return {
			stats: {
				size: stats.size,
				modifiedAt: stats.mtime.toISOString(),
				createdAt: stats.birthtime.toISOString(),
				isDirectory: stats.isDirectory(),
			},
		};
	} catch (error) {
		return { error: "Failed to get file stats" };
	}
}
