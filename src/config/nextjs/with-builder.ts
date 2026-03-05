import BuilderDevTools from "@builder.io/dev-tools/next";
import type { NextConfig } from "next";
import { buildTimeFeatures } from "../features-config";

/**
 * Applies Builder.io configuration to the Next.js config.
 * @param nextConfig The existing Next.js configuration object.
 * @returns The modified Next.js configuration object with Builder support.
 */

const builderConfig = {};
export function withBuilderConfig(nextConfig: NextConfig): NextConfig {
	if (buildTimeFeatures.BUILDER_ENABLED) {
		return BuilderDevTools(builderConfig)(nextConfig);
	}
	return nextConfig;
}
