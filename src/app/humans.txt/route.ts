import { siteConfig } from "@/config/site-config";

/**
 * humans.txt — human-readable credits and repository reference.
 *
 * See https://humanstxt.org for the convention.
 */
export function GET() {
	const content = [
		"/* TEAM */",
		`Name: ${siteConfig.creator.fullName}`,
		`Role: ${siteConfig.creator.role}`,
		`Site: ${siteConfig.creator.url}`,
		`Twitter: ${siteConfig.creator.twitter}`,
		`Location: ${siteConfig.creator.location}`,
		"",
		"/* SITE */",
		`Name: ${siteConfig.title}`,
		`URL: ${siteConfig.url}`,
		`Description: ${siteConfig.description}`,
		`Standards: HTML5, CSS3`,
		`Components: Next.js, React, Tailwind CSS, TypeScript`,
		"",
		"/* SOURCE */",
		`Repository: ${siteConfig.repo.url}`,
		`Clone: ${siteConfig.repo.format.clone()}`,
		`SSH: ${siteConfig.repo.format.ssh()}`,
	].join("\n");

	return new Response(content, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=86400",
		},
	});
}
