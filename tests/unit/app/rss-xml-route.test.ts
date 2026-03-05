import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { siteConfig } from "@/config/site-config";
import { routes } from "@/config/routes";

vi.mock("@/lib/blog", () => ({
    getBlogPosts: vi.fn(),
}));

// Import after mocking
import { GET } from "@/app/rss.xml/route";
import { getBlogPosts } from "@/lib/blog";

describe("RSS feed route (/rss.xml)", () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it("returns valid RSS with items sorted by publishedAt desc", async () => {
        (getBlogPosts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
            {
                title: "Older post",
                slug: "older-post",
                content: "Older content",
                description: "Older description",
                publishedAt: "2024-06-10T12:00:00.000Z",
                categories: ["dev"],
            },
            {
                title: "Newest post",
                slug: "newest-post",
                content: "Newest content with ]]> token",
                // No description to exercise fallback and CDATA escaping
                publishedAt: "2024-07-15T12:00:00.000Z",
                categories: ["news"],
            },
            {
                title: "Draft post",
                slug: "draft-post",
                content: "No publishedAt should exclude",
                categories: [],
            },
        ]);

        const res = await GET(undefined as unknown as NextRequest);
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8");
        expect(res.headers.get("cache-control")).toContain("s-maxage=");

        const xml = await res.text();
        expect(xml).toContain(`<?xml version="1.0" encoding="UTF-8"?>`);
        expect(xml).toContain(`<rss version="2.0"`);
        expect(xml).toContain(`xmlns:atom="http://www.w3.org/2005/Atom"`);
        expect(xml).toContain(`<atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml" />`);
        expect(xml).toContain(`<link>${siteConfig.url}${routes.blog}</link>`);

        // Two items present, draft excluded
        expect(xml.match(/<item>/g)?.length).toBe(2);

        // Newest appears before older
        const idxNewest = xml.indexOf("newest-post");
        const idxOlder = xml.indexOf("older-post");
        expect(idxNewest).toBeGreaterThan(-1);
        expect(idxOlder).toBeGreaterThan(-1);
        expect(idxNewest).toBeLessThan(idxOlder);

        // CDATA escaping of ']]>' occurs inside description for fallback
        expect(xml).toContain("]]&gt;");
    });

    it("handles empty post list and still returns a channel", async () => {
        (getBlogPosts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        const res = await GET(undefined as unknown as NextRequest);
        expect(res.status).toBe(200);
        const xml = await res.text();
        expect(xml).toContain("<channel>");
        expect(xml).toContain("<lastBuildDate>");
        expect(xml.match(/<item>/g)).toBeNull();
    });
});


