import { siteConfig } from "@/config/site-config";

/**
 * .well-known/repository — machine-readable repository discovery endpoint.
 *
 * Returns JSON with the project's VCS URL and type so that agents and
 * tools can locate the source repository from the deployed website.
 */
export function GET() {
	return Response.json(
		{
			url: siteConfig.repo.url,
			type: "git",
			owner: siteConfig.repo.owner,
			name: siteConfig.repo.name,
			clone: siteConfig.repo.format.clone(),
			ssh: siteConfig.repo.format.ssh(),
		},
		{
			headers: {
				"Cache-Control": "public, max-age=86400",
			},
		},
	);
}
