"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "6e6573f3-66c3-40d7-a161-031b22099a17";

export function Analytics() {
	return (
		<>
			<VercelAnalytics />
			<SpeedInsights />
			<Script
				defer
				src="https://analytics.lacy.sh/script.js"
				data-website-id={WEBSITE_ID}
			/>
		</>
	);
}
