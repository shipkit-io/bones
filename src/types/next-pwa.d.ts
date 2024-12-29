declare module "next-pwa" {
	import { NextConfig } from "next";

	interface PWAConfig {
		dest?: string;
		disable?: boolean;
		register?: boolean;
		skipWaiting?: boolean;
		scope?: string;
		sw?: string;
		runtimeCaching?: {
			urlPattern: RegExp | string;
			handler: string;
			options?: Record<string, unknown>;
		}[];
		buildExcludes?: (string | RegExp)[];
		publicExcludes?: (string | RegExp)[];
		fallbacks?: Record<string, string>;
		cacheOnFrontEndNav?: boolean;
		reloadOnOnline?: boolean;
		register?: boolean;
		scope?: string;
		sw?: string;
		dynamicStartUrl?: boolean;
	}

	function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig;
	export = withPWA;
}
