import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site-config";
import { routes } from "@/config/routes";

export default function sitemap(): MetadataRoute.Sitemap {
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
  const excludedRoutes = ["/api", "/workers", "/sign-out", "/error", "/admin"];

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

  // Sort by priority and then alphabetically
  sitemapEntries.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.url.localeCompare(b.url);
  });

  return sitemapEntries;
}
