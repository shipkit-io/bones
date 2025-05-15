import { FILE_UPLOAD_MAX_SIZE } from "@/config/file";
import { redirects } from "@/config/routes";
import { withPlugins } from "@/config/with-plugins";
import type { NextConfig } from "next";

/**
 * Validate environment variables
 *
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

const nextConfig: NextConfig = {
	/*
	 * Redirects are located in the `src/config/routes.ts` file
	 */
	redirects,
	/*
	 * Next.js configuration
	 */
	images: {
		remotePatterns: [
			{ hostname: "picsum.photos" }, // @dev: for testing
			{ hostname: "avatar.vercel.sh" }, // @dev: for testing
			{ hostname: "github.com" }, // @dev: for testing
			{ hostname: "images.unsplash.com" }, // @dev: for testing
			{ hostname: "2.gravatar.com" }, // @dev: for testing
			{ hostname: "avatars.githubusercontent.com" }, // @dev: github avatars
			{ hostname: "vercel.com" }, // @dev: vercel button
			{
				protocol: "https",
				hostname: "**.vercel.app",
			},
		],
	},

	/*
	 * React configuration
	 */
	reactStrictMode: true,

	/*
	 * Source maps
	 */
	productionBrowserSourceMaps: true,

	/*
	 * Lint configuration
	 */
	eslint: {
		/*
			!! WARNING !!
			* This allows production builds to successfully complete even if
			* your project has ESLint errors.
		*/
		ignoreDuringBuilds: true,
	},
	typescript: {
		/*
			!! WARNING !!
			* Dangerously allow production builds to successfully complete even if
			* your project has type errors.
		*/
		// ignoreBuildErrors: true,
	},

	// Configure `pageExtensions` to include markdown and MDX files
	pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

	/*
	 * Experimental configuration
	 */
	experimental: {
		// esmExternals: true,
		// mdxRs: true,
		// mdxRs: {
		// 	jsxRuntime: "automatic",
		// 	jsxImportSource: "jsx-runtime",
		// 	mdxType: "gfm",
		// },

		nextScriptWorkers: true,
		serverActions: {
			bodySizeLimit: FILE_UPLOAD_MAX_SIZE,
		},
		webVitalsAttribution: ["CLS", "LCP", "TTFB", "FCP", "FID"],
		// instrumentationHook: true, // Removed from experimental
	},
	/*
	 * Miscellaneous configuration
	 */
	// devIndicators: {
	// buildActivityPosition: "bottom-right" as const,
	// },

	/*
	 * Logging configuration
	 * @see https://nextjs.org/docs/app/api-reference/next-config-js/logging
	 */
	logging: {
		fetches: {
			fullUrl: true, // This will log the full URL of the fetch request even if cached
			// hmrRefreshes: true,
		},
	},

	// compiler: {
	// Remove all console logs
	// removeConsole: true
	// Remove console logs only in production, excluding error logs
	// removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false
	// },
};

/*
 * Apply Next.js configuration plugins using the withPlugins utility.
 * The utility handles loading and applying functions exported from files
 * in the specified directory (default: src/config/nextjs).
 */
export default withPlugins(nextConfig);
