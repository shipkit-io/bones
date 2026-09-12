import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A `loading.tsx` wraps its segment's page and every segment below it in a
 * Suspense boundary. When a page under that boundary awaits data and then
 * calls `notFound()`, Next.js has already streamed the shell with HTTP 200, so
 * the visitor gets a not-found body with a 200 status: a soft 404. Crawlers
 * index it, and the not-found render can throw React #419 on the client.
 *
 * Rules, checked per page that calls `notFound()`:
 * 1. No `loading.*` in any ancestor folder. An ancestor's boundary also wraps
 *    this segment's layout, so nothing above can decide the status first.
 * 2. A `loading.*` in the page's own folder is allowed only when a sibling
 *    `layout.tsx` calls `notFound()`. The layout renders above the boundary,
 *    so it settles the status and the page keeps its skeleton.
 *
 * Want a skeleton on a page that can 404? Put the existence check in that
 * segment's layout (see changelog/[...slug]/layout.tsx), or use an in-page
 * <Suspense> around the slow part (see changelog/page.tsx).
 */
const APP_DIR = join(process.cwd(), "src", "app");
const LOADING_FILES = ["loading.tsx", "loading.ts", "loading.jsx", "loading.js"];

function walk(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/^page\.tsx?$/.test(name)) out.push(full);
	}
	return out;
}

const callsNotFound = (file: string) => /\bnotFound\(\)/.test(readFileSync(file, "utf8"));

const loadingFilesIn = (dir: string) =>
	LOADING_FILES.map((f) => join(dir, f)).filter((f) => existsSync(f));

const notFoundPages = walk(APP_DIR).filter(callsNotFound);

describe("no loading.tsx above a page that calls notFound()", () => {
	it("finds at least one page that can 404 (sanity)", () => {
		expect(notFoundPages.length).toBeGreaterThan(0);
	});

	it.each(
		notFoundPages.map((file) => [relative(APP_DIR, file), file])
	)("%s: loading files above it cannot commit a 200 first", (_label, file) => {
		const pageDir = dirname(file);
		const offenders: string[] = [];

		// Own folder: allowed only if a sibling layout settles the 404 first.
		const layout = join(pageDir, "layout.tsx");
		const layoutSettles404 = existsSync(layout) && callsNotFound(layout);
		if (!layoutSettles404) offenders.push(...loadingFilesIn(pageDir));

		// Ancestors: never allowed.
		let dir = dirname(pageDir);
		while (dir.startsWith(APP_DIR)) {
			offenders.push(...loadingFilesIn(dir));
			if (dir === APP_DIR) break;
			dir = dirname(dir);
		}

		expect(offenders.map((f) => relative(APP_DIR, f))).toEqual([]);
	});
});
