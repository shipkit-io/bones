"use client";
import { StatsigProvider, useClientAsyncInit } from "@statsig/react-bindings";
import { StatsigSessionReplayPlugin } from "@statsig/session-replay";
import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";
import type React from "react";
import { env } from "@/env";
import { PageViewTracker } from "./statsig-pageview";

interface ProviderProps {
	children: React.ReactNode;
}

// Inner component that contains hooks - only rendered when Statsig is properly configured
function StatsigProviderInner({ children }: ProviderProps) {
	const clientKey = env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
	const user = { userID: undefined as string | undefined };

	const { client } = useClientAsyncInit(clientKey ?? "", user, {
		plugins: [new StatsigAutoCapturePlugin(), new StatsigSessionReplayPlugin()],
	});

	if (!client) {
		return children;
	}

	return (
		<StatsigProvider client={client}>
			<PageViewTracker />
			{children}
		</StatsigProvider>
	);
}

// Lightweight wrapper to conditionally render Statsig only when enabled and key present
export function ShipkitStatsigProvider({ children }: ProviderProps) {
	// Check conditions before rendering any hooks
	if (!env.NEXT_PUBLIC_FEATURE_STATSIG_ENABLED) {
		return <>{children}</>;
	}

	if (!env.NEXT_PUBLIC_STATSIG_CLIENT_KEY) {
		// Feature flag enabled by build-time detection, but key missing at runtime
		return <>{children}</>;
	}

	return <StatsigProviderInner>{children}</StatsigProviderInner>;
}
