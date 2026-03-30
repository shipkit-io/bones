/*
 * Axe runner using Playwright
 * - Visits URLs, injects axe-core, runs accessibility checks, writes JSON reports
 * Usage:
 *   bun run audit:axe -- http://localhost:3000 http://localhost:3000/docs
 *   AXE_URLS="http://localhost:3000" bun run audit:axe
 */
import fs from "node:fs/promises";
import path from "node:path";
import axeSource from "axe-core";
import { chromium } from "playwright";

interface AxeIssue {
	id: string;
	impact: string | null;
	description: string;
	help: string;
	helpUrl: string;
	nodes: { html: string; target: string[]; failureSummary?: string }[];
}

interface AxeReportSummary {
	url: string;
	violations: AxeIssue[];
	passes: number;
	incomplete: number;
	inapplicable: number;
	outputDir: string;
	reportJsonPath: string;
}

function getUrls(): string[] {
	const argv = process.argv.slice(2).filter((a) => !a.startsWith("-"));
	if (argv.length) return argv;
	const env =
		process.env.AXE_URLS?.split(",")
			.map((u) => u.trim())
			.filter(Boolean) ?? [];
	return env.length ? env : ["http://localhost:3000/"];
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

async function runAxeOnUrl(url: string, outBaseDir: string): Promise<AxeReportSummary> {
	const outDir = path.join(outBaseDir, `${safeSlug(url)}-axe`);
	await ensureDir(outDir);
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: "load" });
	await page.addScriptTag({ content: axeSource.source });
	const results = await page.evaluate(async () => {
		return await (window as any).axe.run({
			runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
			resultTypes: ["violations", "passes", "incomplete", "inapplicable"],
		});
	});
	await browser.close();

	const jsonPath = path.join(outDir, "axe.json");
	await fs.writeFile(jsonPath, JSON.stringify(results, null, 2), "utf8");
	const summary: AxeReportSummary = {
		url,
		violations: results.violations ?? [],
		passes: results.passes?.length ?? 0,
		incomplete: results.incomplete?.length ?? 0,
		inapplicable: results.inapplicable?.length ?? 0,
		outputDir: outDir,
		reportJsonPath: jsonPath,
	};
	return summary;
}

async function main(): Promise<void> {
	const urls = getUrls();
	const outDir = process.env.AXE_OUT_DIR ?? ".axe";
	await ensureDir(outDir);
	const summaries: AxeReportSummary[] = [];
	for (const url of urls) {
		console.log(`[axe] Running on ${url}`);
		const summary = await runAxeOnUrl(url, outDir);
		summaries.push(summary);

		console.log(`[axe] Violations: ${summary.violations.length}`);
	}
	const indexPath = path.join(outDir, `index-${Date.now()}.json`);
	await fs.writeFile(indexPath, JSON.stringify(summaries, null, 2), "utf8");

	console.log(`[axe] Wrote summary index → ${indexPath}`);
}

main().catch((err) => {
	console.error("[axe] Failed:", err);
	process.exit(1);
});
