/*
 * Lighthouse analyzer
 * - Reads reports within .lighthouse/<run>/lighthouse.json
 * - Normalizes findings into a small set of fix types
 * - Writes .lighthouse/normalized.json
 */
import fs from "node:fs/promises";
import path from "node:path";

interface NormalizedIssue {
	url: string;
	type:
		| "image-missing-dimensions"
		| "legacy-img-tag"
		| "font-preload-missing"
		| "html-lang-missing"
		| "canonical-missing"
		| "large-image-unoptimized"
		| "unused-css"
		| "tap-targets-small"
		| "a11y-alt-missing"
		| "seo-missing-meta";
	details?: Record<string, unknown>;
}

interface LighthouseReportFile {
	finalUrl?: string;
	audits?: Record<string, { score: number | null; details?: unknown; displayValue?: string }>;
	categories?: Record<string, { score: number | null }>;
}

async function findReports(dir: string): Promise<string[]> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		if (entry.isDirectory()) {
			const candidate = path.join(dir, entry.name, "lighthouse.json");
			try {
				await fs.access(candidate);
				files.push(candidate);
			} catch {}
		}
	}
	return files;
}

function pushIf(condition: boolean, issues: NormalizedIssue[], issue: NormalizedIssue): void {
	if (condition) issues.push(issue);
}

async function analyzeReport(filePath: string): Promise<NormalizedIssue[]> {
	const text = await fs.readFile(filePath, "utf8");
	const report: LighthouseReportFile = JSON.parse(text);
	const url = report.finalUrl ?? "";
	const audits = report.audits ?? {};
	const issues: NormalizedIssue[] = [];

	const usesNextImage = false; // Determined later by codemods; keep conservative here

	const imageSizeAudit = audits["image-size-responsive"];
	const imageAspectAudit = audits["unsized-images"];
	const tapTargets = audits["tap-targets"];
	// const usesHttp2 = audits["uses-http2"]; // currently unused
	const fontDisplay = audits["font-display"];
	const lang = audits["html-has-lang"];
	const canonical = audits["document-title"] && audits["meta-description"]; // heuristic for missing meta
	const altText = audits["image-alt"];

	pushIf(imageAspectAudit?.score === 0, issues, { url, type: "image-missing-dimensions" });
	pushIf(imageSizeAudit?.score === 0, issues, { url, type: "large-image-unoptimized" });
	pushIf(!usesNextImage, issues, { url, type: "legacy-img-tag" });
	pushIf(fontDisplay?.score === 0, issues, { url, type: "font-preload-missing" });
	pushIf(lang?.score === 0, issues, { url, type: "html-lang-missing" });
	pushIf(!canonical, issues, { url, type: "seo-missing-meta" });
	pushIf(tapTargets?.score === 0, issues, { url, type: "tap-targets-small" });
	pushIf(altText?.score === 0, issues, { url, type: "a11y-alt-missing" });

	return issues;
}

async function main(): Promise<void> {
	const baseDir = process.env.LH_OUT_DIR ?? ".lighthouse";
	const reports = await findReports(baseDir);
	const allIssues: NormalizedIssue[] = [];
	for (const file of reports) {
		const issues = await analyzeReport(file);
		allIssues.push(...issues);
	}
	const out = path.join(baseDir, "normalized.json");
	await fs.writeFile(out, JSON.stringify(allIssues, null, 2), "utf8");

	console.log(`[analyze] Wrote normalized issues → ${out} (${allIssues.length})`);
}

main().catch((err) => {
	console.error("[analyze] Failed:", err);
	process.exit(1);
});
