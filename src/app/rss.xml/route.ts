import type { NextRequest } from "next/server";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site-config";
import { routes } from "@/config/routes";
import { getBlogPosts } from "@/lib/blog";

function escapeCdata(input: string): string {
    // Prevent accidental CDATA termination sequences
    return input.replaceAll("]]>", "]]&gt;");
}

function escapeXml(input: string): string {
    return input.replace(/[<>&'"]/g, (char) => {
        switch (char) {
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "&":
                return "&amp;";
            case "'":
                return "&apos;";
            case '"':
                return "&quot;";
            default:
                return char;
        }
    });
}

function sanitizeText(input: string | undefined): string {
    if (!input) return "";
    return input
        .replace(/\s+/g, " ")
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim();
}

export async function GET(_req: NextRequest): Promise<Response> {
    // Return 404 if blog is not enabled
    if (process.env.NEXT_PUBLIC_HAS_BLOG !== "true") {
        notFound();
    }
    const posts = await getBlogPosts();
    const sorted = posts
        .filter((p) => p.publishedAt && !isNaN(new Date(p.publishedAt).getTime()))
        .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());

    const lastBuildDate = sorted[0]?.publishedAt
        ? new Date(sorted[0].publishedAt).toUTCString()
        : new Date().toUTCString();

    const channelTitle = escapeXml(sanitizeText(`${siteConfig.title} Blog`));
    const channelLink = escapeXml(`${siteConfig.url}${routes.blog}`);
    const channelDescription = escapeXml(sanitizeText(siteConfig.description));

    const itemsXml = sorted
        .map((post) => {
            const link = escapeXml(`${siteConfig.url}${routes.blog}/${post.slug}`);
            const title = escapeXml(sanitizeText(post.title));
            const description = escapeCdata(
                sanitizeText(post.description || post.content?.slice(0, 280) || "")
            );
            const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : lastBuildDate;
            const guid = link;

            return `\n      <item>
        <title>${title}</title>
        <link>${link}</link>
        <guid isPermaLink="true">${guid}</guid>
        <description><![CDATA[${description}]]></description>
        <pubDate>${pubDate}</pubDate>
      </item>`;
        })
        .join("");

    const selfHref = escapeXml(`${siteConfig.url}/rss.xml`);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${channelTitle}</title>
    <link>${channelLink}</link>
    <description>${channelDescription}</description>
    <atom:link href="${selfHref}" rel="self" type="application/rss+xml" />
    <language>en-US</language>
    <ttl>60</ttl>
    <generator>Next.js / Shipkit</generator>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>${itemsXml}
  </channel>
</rss>`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
    });
}
