import type { MetadataRoute } from "next";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";

interface SitemapEntry {
	url: string;
	lastModified?: string | Date;
	changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
	priority?: number;
}

export async function generateSitemapEntries(): Promise<SitemapEntry[]> {
	const entries: SitemapEntry[] = [];

	// High priority static routes
	const highPriorityRoutes = [routes.home, routes.docs, routes.features, routes.pricing].map(
		(route) => ({
			url: `${siteConfig.url}${route}`,
			lastModified: new Date().toISOString(),
			changeFrequency: "daily" as const,
			priority: 1,
		})
	);

	// Medium priority static routes
	const mediumPriorityRoutes = [routes.faq, routes.download].map((route) => ({
		url: `${siteConfig.url}${route}`,
		lastModified: new Date().toISOString(),
		changeFrequency: "weekly" as const,
		priority: 0.8,
	}));

	// Low priority static routes
	const lowPriorityRoutes = [routes.terms, routes.privacy].map((route) => ({
		url: `${siteConfig.url}${route}`,
		lastModified: new Date().toISOString(),
		changeFrequency: "monthly" as const,
		priority: 0.5,
	}));

	// Example routes
	const exampleRoutes = Object.values(routes.examples)
		.filter(
			(route): route is string => typeof route === "string" && route !== routes.examples.index
		)
		.map((route) => ({
			url: `${siteConfig.url}${route}`,
			lastModified: new Date().toISOString(),
			changeFrequency: "weekly" as const,
			priority: 0.7,
		}));

	// Add all entries
	entries.push(
		...highPriorityRoutes,
		...mediumPriorityRoutes,
		...lowPriorityRoutes,
		...exampleRoutes
	);

	return entries;
}

export async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
	const entries = await generateSitemapEntries();
	return entries;
}
