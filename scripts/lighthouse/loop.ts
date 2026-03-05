/*
 * Audit → Analyze → Fix → Verify loop
 * - Runs Lighthouse, analyzes issues, runs fixers, and re-runs until thresholds pass or max iterations reached
 * Usage:
 *   bun run audit:lh:loop -- http://localhost:3000
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { runFixers } from "./fixers";

interface NormalizedIssue {
	url: string;
	type: string;
}

interface Thresholds {
	performance: number;
	accessibility: number;
	seo: number;
	bestPractices: number;
}

function exec(
	cmd: string,
	args: string[],
	env?: Record<string, string>
): Promise<{ code: number }> {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { stdio: "inherit", env: { ...process.env, ...env } });
		child.on("close", (code) => resolve({ code: code ?? 1 }));
		child.on("error", reject);
	});
}

async function readLatestSummary(baseDir: string): Promise<Record<string, number>> {
	const dir = baseDir;
	const entries = await fs.readdir(dir);
	const indexes = entries.filter((f) => f.startsWith("index-") && f.endsWith(".json"));
	if (indexes.length === 0) return {};
	const latestEntry = indexes.sort().at(-1);
	if (!latestEntry) return {};
	const latest = latestEntry;
	const json = JSON.parse(await fs.readFile(path.join(dir, latest), "utf8"));
	// For single URL run, take first categories
	const first = Array.isArray(json) ? json[0] : undefined;
	return first?.categories ?? {};
}

async function readIssues(baseDir: string): Promise<NormalizedIssue[]> {
	const file = path.join(baseDir, "normalized.json");
	try {
		const text = await fs.readFile(file, "utf8");
		return JSON.parse(text);
	} catch {
		return [];
	}
}

function categoriesMeetThresholds(categories: Record<string, number>, t: Thresholds): boolean {
	const performance = categories.performance ?? categories.performance;
	const accessibility = categories.accessibility ?? categories.accessibility;
	const seo = categories.seo ?? categories.seo;
	const bestPractices = categories["best-practices"] ?? categories.bestPractices;
	return (
		(performance ?? 0) >= t.performance &&
		(accessibility ?? 0) >= t.accessibility &&
		(seo ?? 0) >= t.seo &&
		(bestPractices ?? 0) >= t.bestPractices
	);
}

async function main(): Promise<void> {
	const urls = process.argv.slice(2).filter((a) => !a.startsWith("-"));
	const LH_OUT_DIR = process.env.LH_OUT_DIR ?? ".lighthouse";
	const thresholds: Thresholds = {
		performance: Number(process.env.LH_T_PERF ?? 90),
		accessibility: Number(process.env.LH_T_A11Y ?? 95),
		seo: Number(process.env.LH_T_SEO ?? 95),
		bestPractices: Number(process.env.LH_T_BP ?? 95),
	};
	const maxIters = Number(process.env.LH_MAX_ITERS ?? 2);

	for (let i = 0; i < maxIters; i++) {
		console.log(`\n[loop] Iteration ${i + 1}/${maxIters}`);

		const runArgs = ["scripts/lighthouse/run.ts", ...urls];
		const runRes = await exec("tsx", runArgs, { LH_OUT_DIR });
		if (runRes.code !== 0) throw new Error("lighthouse run failed");

		const analyzeRes = await exec("tsx", ["scripts/lighthouse/analyze.ts"], { LH_OUT_DIR });
		if (analyzeRes.code !== 0) throw new Error("analyze failed");

		const categories = await readLatestSummary(LH_OUT_DIR);

		console.log("[loop] Categories:", categories);
		if (categoriesMeetThresholds(categories, thresholds)) {
			console.log("[loop] Thresholds met. Exiting.");
			return;
		}

		const issues = await readIssues(LH_OUT_DIR);

		console.log(`[loop] ${issues.length} normalized issues`);
		const { changedFiles, notes } = await runFixers();
		if (notes.length) {
			console.log(`[loop] Fixer notes:\n - ${notes.join("\n - ")}`);
		}
		if (changedFiles.length === 0) {
			console.log("[loop] No changes from fixers; stopping.");
			break;
		}

		console.log(`[loop] Applied changes to ${changedFiles.length} files. Re-running audits...`);
	}
}

main().catch((err) => {
	console.error("[loop] Failed:", err);
	process.exit(1);
});
