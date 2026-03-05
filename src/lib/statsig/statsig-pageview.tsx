"use client";
import { useStatsigClient } from "@statsig/react-bindings";
import { useEffect } from "react";

export function PageViewTracker() {
	const { client } = useStatsigClient();

	useEffect(() => {
		if (!client) return;
		// Optional: capture an initial page view event
		client.logEvent("$pageview");
	}, [client]);

	return null;
}
