import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A `loading.tsx` wraps its segment (and every segment below it) in a Suspense
 * boundary. When a page under that boundary awaits data and then calls
 * `notFound()`, Next.js has already streamed the shell with HTTP 200, so the
 * visitor gets a not-found body with a 200 status: a soft 404. Crawlers index
 * it, and the not-found render can throw React #419 on the client.
 *
 * Rule: no `loading.tsx` in the folder of a page that calls `notFound()`, nor
 * in any folder above it. Put loading states inside routes that never 404.
 */
const APP_DIR = join(process.cwd(), "src", "app");

function walk(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/^page\.tsx?$/.test(name)) out.push(full);
	}
	return out;
}

const notFoundPages = walk(APP_DIR).filter((file) =>
	/\bnotFound\(\)/.test(readFileSync(file, "utf8"))
);

describe("no loading.tsx above a page that calls notFound()", () => {
	it("finds at least one page that can 404 (sanity)", () => {
		expect(notFoundPages.length).toBeGreaterThan(0);
	});

	it.each(
		notFoundPages.map((file) => [relative(APP_DIR, file), file])
	)("%s has no loading.tsx in its folder or any ancestor", (_label, file) => {
		const offenders: string[] = [];
		let dir = dirname(file);
		while (dir.startsWith(APP_DIR)) {
			for (const candidate of ["loading.tsx", "loading.ts", "loading.jsx", "loading.js"]) {
				if (existsSync(join(dir, candidate)))
					offenders.push(relative(APP_DIR, join(dir, candidate)));
			}
			if (dir === APP_DIR) break;
			dir = dirname(dir);
		}
		expect(offenders).toEqual([]);
	});
});
