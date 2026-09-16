import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site-config";
import { routes } from "@/config/routes";
import { getChangelogEntries } from "@/lib/changelog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // Helper to check if a route is external
  const isExternalRoute = (route: string): boolean => {
    return route.startsWith("http") || route.startsWith("mailto:");
  };

  // Helper to flatten nested route objects
  const flattenRoutes = (obj: any, prefix = ""): string[] => {
    let result: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && !isExternalRoute(value)) {
        result.push(value);
      } else if (
        typeof value === "object" &&
        value !== null &&
        !("params" in value)
      ) {
        // Recursively flatten nested objects (but skip route objects with params)
        result = [...result, ...flattenRoutes(value)];
      }
    }

    return result;
  };

  // Get all internal routes
  const allRoutes = flattenRoutes(routes);

  // Define routes to exclude from sitemap
  const excludedRoutes = [
    "/api",
    "/workers",
    "/sign-out",
    "/sign-in",
    "/sign-up",
    "/error",
    "/admin",
    "/dashboard",
    "/settings",
    "/api-keys",
    "/forgot-password",
    "/og",
    "/trpc",
    "/launch",
    "/docs", // planned route, no page exists yet (LAC-2783)
    "/v1", // CLI logger API endpoint, not a page (LAC-2783)
  ];

  // Filter routes
  const includedRoutes = allRoutes.filter((route) => {
    // Exclude API routes, worker routes, and other technical routes
    return !excludedRoutes.some((excluded) => route.startsWith(excluded));
  });

  // Add root route if not present
  if (!includedRoutes.includes("/")) {
    includedRoutes.unshift("/");
  }

  // Create sitemap entries
  const sitemapEntries = includedRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority:
      route === "/"
        ? 1
        : route.includes("auth") || route.includes("sign")
          ? 0.5
          : 0.8,
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
