import type { NextConfig } from "next";
import withPWA from "next-pwa";
import { buildTimeFeatures } from "../features-config";

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
    disable: process.env.NODE_ENV === "development" || !buildTimeFeatures.PWA_ENABLED,
  };

  // next-pwa ships its config type as a loose object; re-declare the shape we
  // use so the call site stays typed without widening to `any`.
  const applyPWA = withPWA as unknown as (
    config: typeof pwaConfig
  ) => (config: NextConfig) => NextConfig;
  return applyPWA(pwaConfig)(nextConfig);
}
