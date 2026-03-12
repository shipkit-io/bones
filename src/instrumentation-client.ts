"use client";

import { buildTimeFeatures } from "@/config/features-config";
import { POSTHOG_RELAY_SLUG } from "@/lib/posthog/posthog-config";

/*
 * Client Instrumentation (Next.js 15.3+)
 * Initializes PostHog on the client before hydration.
 * Uses dynamic import to avoid pulling posthog-js into the bundle when disabled.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

// Guard using build-time feature flags and presence of env at runtime
const posthogEnabled = process.env.NEXT_PUBLIC_FEATURE_POSTHOG_ENABLED;
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? POSTHOG_RELAY_SLUG;

if (posthogEnabled && posthogKey && posthogHost) {
	void import("posthog-js")
		.then(({ default: posthog }) => {
			posthog.init(posthogKey, {
				api_host: posthogHost,
				ui_host: "https://us.posthog.com",
				defaults: "2025-05-24",
			});

			if (process.env.NODE_ENV !== "production") {
				(globalThis as unknown as { posthog?: typeof posthog }).posthog = posthog;
			}
		})
		.catch(() => {
			// Silently ignore analytics init failures in client instrumentation
		});
}
