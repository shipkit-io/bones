import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site-config";

/**
 * Regression test for LAC-2792: prod served og:image from shipkit.io
 * (ShipKit branding) because the bones-www fix for this never reached the
 * canonical repo. Social shares of bones.sh must use Bones' own OG image.
 *
 * Invariant: the OG image lives on the site's own domain, which has a
 * working /og route.
 */

describe("og image", () => {
	it("serves the OG image from the site's own domain", () => {
		expect(new URL(siteConfig.ogImage).origin).toBe(new URL(siteConfig.url).origin);
	});
});
