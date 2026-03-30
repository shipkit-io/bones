import type { MetadataRoute } from "next";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";

interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

export async function generateSitemapEntries(): Promise<SitemapEntry[]> {
  const now = new Date().toISOString();

  const highPriorityRoutes = [routes.home, routes.features, routes.docs].map(
    (route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1,
    }),
  );

  const lowPriorityRoutes = [routes.terms, routes.privacy].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...highPriorityRoutes, ...lowPriorityRoutes];
}

export async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  return generateSitemapEntries();
}
