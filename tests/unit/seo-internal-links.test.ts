import { describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { defaultFooterGroups } from "@/components/footers/footer";
import { defaultNavLinks } from "@/config/navigation";
import { siteConfig } from "@/config/site-config";

/**
 * Regression tests for LAC-2783: Ahrefs reported orphan pages on bones.sh
 * (sitemap URLs with no incoming internal links) and dead URLs (/docs, /v1)
 * in the sitemap.
 *
 * Invariant: every URL we advertise in the sitemap must be reachable from
 * the global site chrome (header nav or footer), and routes without pages
 * must never be emitted in the sitemap.
 */

// The sitemap pulls changelog entries from the GitHub API (LAC-3521);
// stub the fields it reads so unit tests stay offline and deterministic.
vi.mock("@/lib/changelog", () => ({
	getChangelogEntries: async () => [
		{ slug: "1.2.3", publishedAt: "2026-01-01T00:00:00.000Z" },
	],
}));

// Built once and shared: the sitemap is identical across tests.
const sitemapEntries = sitemap();
const sitemapPaths = async () =>
	(await sitemapEntries).map((entry) => new URL(entry.url).pathname.replace(/\/$/, "") || "/");

const chromeHrefs = () => {
	const footerHrefs = defaultFooterGroups.flatMap((element) => {
		if (element.type !== "group") return [];
		return element.content.items.flatMap((item) =>
			item && typeof item === "object" && "href" in item && typeof item.href === "string"
				? [item.href]
				: [],
		);
	});
	const navHrefs = defaultNavLinks.map((link) => link.href);
	return new Set([...footerHrefs, ...navHrefs]);
};

describe("sitemap hygiene (LAC-2783)", () => {
	it("does not include routes that have no page", async () => {
		const paths = await sitemapPaths();
		expect(paths).not.toContain("/docs"); // planned route, never implemented
		expect(paths).not.toContain("/v1"); // CLI logger API endpoint, not a page
		expect(paths).not.toContain("/trpc"); // demo page, should not be indexed
	});

	it("uses the production site url", async () => {
		for (const entry of await sitemapEntries) {
			expect(entry.url.startsWith(siteConfig.url)).toBe(true);
		}
	});

	it("includes changelog entry pages (LAC-3521)", async () => {
		// Changelog entries are indexable and linked from /changelog; leaving
		// them out trips Ahrefs "Indexable page not in sitemap".
		expect(await sitemapPaths()).toContain("/changelog/1.2.3");
	});
});

describe("no orphan pages (LAC-2783)", () => {
	it("links every sitemap URL from the header nav or footer", async () => {
		const links = chromeHrefs();
		const orphans = (await sitemapPaths()).filter(
			(path) =>
				path !== "/" &&
				// Changelog entries are linked from the /changelog index, not the chrome.
				!path.startsWith("/changelog/") &&
				!links.has(path),
		);
		expect(orphans).toEqual([]);
	});
});
