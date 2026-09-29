import type { MetadataRoute } from "next";
import { bonesPages } from "@/config/bones-routes";
import { siteConfig } from "@/config/site-config";
import { getChangelogEntries } from "@/lib/changelog";

/**
 * Bones' sitemap lists the pages Bones actually ships (`bonesPages`) plus the
 * changelog entries. It does not walk `routes.ts`: that file is shared with
 * ShipKit and names many routes Bones has no page for (LAC-2783).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  const sitemapEntries = bonesPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "/" ? 1 : 0.8,
  }));

  // Changelog entries are indexable pages linked from /changelog; without
  // them Ahrefs flags "Indexable page not in sitemap" (LAC-3521). The helper
  // returns [] if the GitHub API is unreachable, so the build never fails.
  const changelogEntries = await getChangelogEntries();
  for (const entry of changelogEntries) {
    sitemapEntries.push({
      url: `${baseUrl}/changelog/${entry.slug}`,
      lastModified: entry.publishedAt ? new Date(entry.publishedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    });
  }

  // Sort by priority and then alphabetically
  sitemapEntries.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.url.localeCompare(b.url);
  });

  return sitemapEntries;
}
