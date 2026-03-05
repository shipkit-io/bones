import Script from "next/script";
import { env } from "@/env";

export const UmamiAnalytics = () => {
	// Check if the Umami feature is explicitly enabled
	if (!env.NEXT_PUBLIC_FEATURE_UMAMI_ENABLED) {
		return null; // Return null if the feature is disabled
	}

	// Also check if the website ID is actually present
	if (!env?.NEXT_PUBLIC_UMAMI_WEBSITE_ID) {
		console.warn("Umami feature is enabled but Website ID is missing.");
		return null;
	}

	return (
		<Script
			src="https://umami-woad-two.vercel.app/script.js"
			data-website-id={env?.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
			defer
		/>
	);
};
