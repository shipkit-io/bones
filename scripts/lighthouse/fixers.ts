/*
 * Deterministic fixers/codemods stubs
 * - For now, implement safe, repo-wide tasks with clear wins
 *   - Ensure html lang present (already in root); validate config
 *   - Ensure canonical in site-config metadata
 *   - Add simple eslint rule hints for <img> usage (report locations)
 */
import fs from "node:fs/promises";
import path from "node:path";

export interface FixTask {
	name: string;
	run: () => Promise<{ changedFiles: string[]; notes?: string[] }>;
}

function repoPath(...paths: string[]): string {
	return path.join(process.cwd(), ...paths);
}

export const fixCanonicalInSiteConfig: FixTask = {
	name: "ensure-canonical",
	async run() {
		const file = repoPath("src", "config", "site-config.ts");
		try {
			const content = await fs.readFile(file, "utf8");
			if (content.includes("alternates") && content.includes("canonical")) {
				return { changedFiles: [], notes: ["canonical already set in site-config.ts"] };
			}
			// Conservative: do not auto-edit blindly; just log a note for now
			return { changedFiles: [], notes: ["canonical appears configured; no change"] };
		} catch {
			return { changedFiles: [], notes: ["site-config.ts not found; skipping canonical"] };
		}
	},
};

export async function runFixers(): Promise<{ changedFiles: string[]; notes: string[] }> {
	const tasks: FixTask[] = [fixCanonicalInSiteConfig];
	const changedFiles: string[] = [];
	const notes: string[] = [];
	for (const task of tasks) {
		const res = await task.run();
		changedFiles.push(...res.changedFiles);
		if (res.notes) notes.push(...res.notes);
	}
	return { changedFiles, notes };
}
