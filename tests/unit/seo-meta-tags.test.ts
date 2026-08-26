import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { metadata as authLayoutMetadata } from "@/app/(app)/(authentication)/layout";
import { Footer } from "@/components/footers/footer";
import {
	constructMetadata,
	defaultMetadata,
	noIndexRobots,
	routeMetadata,
} from "@/config/metadata";
import { siteConfig } from "@/config/site-config";

/**
 * Regression tests for LAC-3521: Ahrefs site audit on bones.sh reported
 * "Open Graph URL not matching canonical" (og:url was hardcoded to the site
 * root on every page), "Multiple H1 tags" (the footer rendered the site name
 * as an <h1> on every page), and meta descriptions outside the 110–160
 * character range Ahrefs considers healthy.
 */

// Ahrefs flags descriptions shorter than 110 or longer than 160 characters.
const DESCRIPTION_MIN = 110;
const DESCRIPTION_MAX = 160;

describe("og:url matches canonical (LAC-3521)", () => {
	it("derives og:url per-page the same way as the canonical URL", () => {
		// "./" resolves against metadataBase + the current route's pathname,
		// so og:url and canonical stay identical on every page.
		expect(defaultMetadata.alternates?.canonical).toBe("./");
		expect(defaultMetadata.openGraph?.url).toBe("./");
		expect(constructMetadata({ title: "Anything" }).openGraph?.url).toBe("./");
	});
});

describe("single H1 per page (LAC-3521)", () => {
	it("does not render the site name in the footer as an <h1>", () => {
		const { container } = render(createElement(Footer));
		expect(container.querySelector("h1")).toBeNull();
	});
});

describe("meta description lengths (LAC-3521)", () => {
	it("keeps every routeMetadata description between 110 and 160 characters", () => {
		// routeMetadata is the single source for page descriptions, including
		// the legal MDX pages, which import their metadata from it.
		for (const [route, metadata] of Object.entries(routeMetadata)) {
			const description = metadata.description ?? "";
			expect
				.soft(description.length, `${route} description is ${description.length} chars`)
				.toBeGreaterThanOrEqual(DESCRIPTION_MIN);
			expect
				.soft(description.length, `${route} description is ${description.length} chars`)
				.toBeLessThanOrEqual(DESCRIPTION_MAX);
		}
	});
});

describe("auth pages are noindex (LAC-3521)", () => {
	it("marks the authentication segment noindex to match its sitemap exclusion", () => {
		expect(authLayoutMetadata.robots).toBe(noIndexRobots);
	});
});

describe("route titles rely on the layout title template (LAC-3521)", () => {
	it("does not hardcode the site name suffix that the template already appends", () => {
		// The (app) layout applies `%s | Bones` to child segments, so a manual
		// suffix renders as "About | Bones | Bones". The home page is exempt:
		// title.template does not apply to the segment that defines it.
		for (const [route, metadata] of Object.entries(routeMetadata)) {
			if (route === "home") continue;
			expect
				.soft(metadata.title, `${route} title duplicates the template suffix`)
				.not.toMatch(new RegExp(`\\|\\s*${siteConfig.branding.projectName}\\s*$`));
		}
	});
});
