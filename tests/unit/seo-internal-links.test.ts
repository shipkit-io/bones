import { describe, expect, it } from "vitest";
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

const sitemapPaths = () =>
	sitemap().map((entry) => new URL(entry.url).pathname.replace(/\/$/, "") || "/");

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
	it("does not include routes that have no page", () => {
		const paths = sitemapPaths();
		expect(paths).not.toContain("/docs"); // planned route, never implemented
		expect(paths).not.toContain("/v1"); // CLI logger API endpoint, not a page
		expect(paths).not.toContain("/trpc"); // demo page, should not be indexed
	});

	it("uses the production site url", () => {
		for (const entry of sitemap()) {
			expect(entry.url.startsWith(siteConfig.url)).toBe(true);
		}
	});
});

describe("no orphan pages (LAC-2783)", () => {
	it("links every sitemap URL from the header nav or footer", () => {
		const links = chromeHrefs();
		const orphans = sitemapPaths().filter((path) => path !== "/" && !links.has(path));
		expect(orphans).toEqual([]);
	});
});
