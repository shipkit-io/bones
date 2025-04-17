import type { NextConfig } from "next";
import withPWA from "next-pwa";

/**
 * Applies PWA configuration to the Next.js config.
 * @param nextConfig The existing Next.js configuration object.
 * @returns The modified Next.js configuration object with PWA support.
 */
export function withPWAConfig(nextConfig: NextConfig): NextConfig {
	const pwaConfig = {
		dest: "public",
		register: true,
		skipWaiting: true,
		disable: process.env.NODE_ENV === "development",
	};

	// The 'withPWA' type might be complex, using 'any' for simplicity here.
	// Ensure 'next-pwa' types are correctly installed if issues arise.
	return (withPWA as any)(pwaConfig)(nextConfig) as NextConfig;
}
