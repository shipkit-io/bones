/** @type {import('next-sitemap').IConfig} */
export default {
	siteUrl: process.env.SITE_URL || "https://www.shipkit.io",
	generateRobotsTxt: true,
	sitemapSize: 7000,
	robotsTxtOptions: {
		policies: [
			// { userAgent: "*", disallow: "/blog/category/*" },
			{ userAgent: "*", allow: "/" },
		],
	},
	// exclude: ["/blog/category/*"],
};
