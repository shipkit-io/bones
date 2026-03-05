import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import { WebVitals } from "@/components/primitives/web-vitals";
import { DataFastAnalytics } from "@/lib/datafast/datafast-analytics";
import { GoogleAnalytics } from "@/lib/google-analytics/google-analytics";
import { GoogleTagManager } from "@/lib/google-tag-manager/google-tag-manager";
import { ShipkitStatsigProvider } from "@/lib/statsig/statsig-provider";
import { UmamiAnalytics } from "@/lib/umami/umami-analytics";

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
	return (
		<>
			<ShipkitStatsigProvider>
				{/* Web Vitals - Above children to track page metrics */}
				<WebVitals />

				{children}

				{/* Metrics - Below children to avoid blocking */}
				<SpeedInsights />

				{/* Analytics */}
				<GoogleAnalytics />
				<GoogleTagManager />
				<UmamiAnalytics />
				<DataFastAnalytics />
				<VercelAnalytics />
			</ShipkitStatsigProvider>
		</>
	);
};
