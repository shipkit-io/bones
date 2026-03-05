import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site-config";

/* Robots.txt Configuration
 * This file controls how search engines and other web robots interact with your site
 * @see https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt
 */
export default function robots(): MetadataRoute.Robots {
	return {
		/* Rules array defines crawler behavior
		 * Each rule object specifies which robots it applies to and what they can/cannot access
		 */
		rules: [
			{
				userAgent: "*", // Applies to all web robots/crawlers
				allow: "/", // Allows crawling of the root path and all unspecified paths

				/* Paths that should not be crawled or indexed
				 * @note Common patterns to exclude:
				 * - API routes to prevent unnecessary crawling of data endpoints
				 * - Next.js internal routes and static files
				 * - Admin areas for security
				 * - Draft/preview content
				 * - Search pages to avoid duplicate content
				 */

				disallow: [
					// "/api/*", // Blocks access to API routes
					// "/static/*", // Blocks access to static assets directory
					// routes.admin.index, // Blocks access to admin panel
					// "*/private/*", // Blocks access to private content
					// "*/draft/*", // Blocks access to draft content
					// "*/preview/*", // Blocks access to preview content
				],
			},
		],

		/* Sitemap URL
		 * Points search engines to your XML sitemap for efficient crawling
		 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
		 */
		// sitemap: `${siteConfig.url}/sitemap.xml`,

		/* Host Directive
		 * Specifies the preferred domain version of your site
		 * @see https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
		 */
		host: siteConfig.url,
	};
}
