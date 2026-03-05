import Script from "next/script";
import { env } from "@/env";

/*
 * DataFast Analytics loader
 * Renders the tracking script when the feature flag is enabled and required envs exist.
 * @see https://datafa.st/docs/nextjs-app-router
 */
export const DataFastAnalytics = () => {
    if (!env.NEXT_PUBLIC_FEATURE_DATAFAST_ENABLED) {
        return null;
    }

    if (!env.NEXT_PUBLIC_DATAFAST_WEBSITE_ID) {
        // Feature is enabled but WEBSITE_ID is missing; skip rendering silently per analytics convention
        return null;
    }

    const dataDomain = env.NEXT_PUBLIC_DATAFAST_DOMAIN;

    return (
        <Script
            src="https://datafa.st/js/script.js"
            data-website-id={env.NEXT_PUBLIC_DATAFAST_WEBSITE_ID}
            {...(dataDomain ? { "data-domain": dataDomain } : {})}
            strategy="afterInteractive"
        />
    );
};


