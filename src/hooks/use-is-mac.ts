"use client";

import { useEffect, useState } from "react";
import { is } from "@/lib/utils/is";

// Extend Navigator type to include userAgentData (might be browser-specific)
interface NavigatorWithUAData extends Navigator {
	userAgentData?: {
		platform: string;
		brands: { brand: string; version: string }[];
		mobile: boolean;
	};
}

/**
 * Hook to determine if the current OS is macOS.
 * Uses navigator.userAgentData if available, otherwise falls back to navigator.platform.
 * Returns false during SSR or if the platform cannot be determined.
 */
export function useIsMac(): boolean {
	const [isMac, setIsMac] = useState(false);

	useEffect(() => {
		let determinedIsMac = false;
		if (typeof window !== "undefined") {
			const nav = navigator as NavigatorWithUAData; // Cast to extended type

			// Prefer userAgentData if available
			if (nav.userAgentData?.platform) {
				determinedIsMac = /mac|iphone|ipad|ipod/i.test(nav.userAgentData.platform);
			} else if (nav.platform) {
				// Fallback to platform
				determinedIsMac = /Mac|iPod|iPhone|iPad/.test(nav.platform);
			} else {
				// Last resort fallback using the existing utility
				determinedIsMac = is.mac;
			}
		}
		setIsMac(determinedIsMac);
	}, []);

	return isMac;
}
