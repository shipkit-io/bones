export default {
	siteUrl: process.env.SITE_URL || process.env.BASE_URL || "https://bones.sh",
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
