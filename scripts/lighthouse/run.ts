/*
 * Lighthouse runner
 * - Runs Lighthouse against one or more URLs and writes JSON/HTML reports per URL
 * - Usage:
 *   bun run audit:lh -- <url1> <url2>
 *   LH_URLS="http://localhost:3000,http://localhost:3000/docs" bun run audit:lh
 *   LH_PRESET=desktop|mobile (default: desktop)
 *   LH_OUT_DIR=.lighthouse (default)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

interface LighthouseRunResultSummary {
	url: string;
	outputDir: string;
	categories: Record<string, number | null>;
	reportJsonPath: string;
	reportHtmlPath: string;
}

function getUrlsFromArgsOrEnv(): string[] {
	const argvUrls = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
	if (argvUrls.length > 0) return argvUrls;
	const envList =
		process.env.LH_URLS?.split(",")
			.map((u) => u.trim())
			.filter(Boolean) ?? [];
	if (envList.length > 0) return envList;
	return ["http://localhost:3000/"];
}

function getPreset(): "desktop" | "mobile" {
	const value = (process.env.LH_PRESET ?? "desktop").toLowerCase();
	return value === "mobile" ? "mobile" : "desktop";
}

function safeSlug(input: string): string {
	return input
		.replace(/^https?:\/\//, "")
		.replace(/[^a-zA-Z0-9]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/(^-|-$)/g, "")
		.slice(0, 120);
}

async function ensureDir(dir: string): Promise<void> {
	await fs.mkdir(dir, { recursive: true });
}

async function runSingle(
	url: string,
	outBaseDir: string,
	preset: "desktop" | "mobile"
): Promise<LighthouseRunResultSummary> {
	const slug = safeSlug(url);
	const outputDir = path.join(outBaseDir, `${slug}-${preset}`);
	await ensureDir(outputDir);

	const chrome = await launch({ chromeFlags: ["--headless", "--no-sandbox"] });
	try {
		const result = await lighthouse(url, {
			port: chrome.port,
			logLevel: "error",
			output: ["json", "html"],
		});

		const lhr = result?.lhr;
		const report = result?.report;

		// report[0] json, report[1] html
		const jsonPath = path.join(outputDir, "lighthouse.json");
		const htmlPath = path.join(outputDir, "lighthouse.html");
		await fs.writeFile(jsonPath, String(report?.[0] ?? ""), "utf8");
		await fs.writeFile(htmlPath, String(report?.[1] ?? ""), "utf8");

		const categories: Record<string, number | null> = {};
		if (lhr?.categories) {
			for (const [key, cat] of Object.entries(lhr.categories)) {
				const score = (cat as any)?.score;
				categories[key] = typeof score === "number" ? Math.round(score * 100) : null;
			}
		}

		return { url, outputDir, categories, reportJsonPath: jsonPath, reportHtmlPath: htmlPath };
	} finally {
		await chrome.kill();
	}
}

async function main(): Promise<void> {
	const urls = getUrlsFromArgsOrEnv();
	const preset = getPreset();
	const outDir = process.env.LH_OUT_DIR ?? ".lighthouse";
	await ensureDir(outDir);

	const results: LighthouseRunResultSummary[] = [];
	for (const url of urls) {
		console.log(`[lighthouse] Running on ${url} (${preset})`);
		const summary = await runSingle(url, outDir, preset);
		results.push(summary);

		console.log(`[lighthouse] Done ${url} →`, summary.categories);
	}

	const indexPath = path.join(outDir, `index-${Date.now()}.json`);
	await fs.writeFile(indexPath, JSON.stringify(results, null, 2), "utf8");

	console.log(`[lighthouse] Wrote summary index → ${indexPath}`);
}

main().catch((error) => {
	console.error("[lighthouse] Failed:", error);
	process.exit(1);
});
