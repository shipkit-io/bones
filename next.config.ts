import {
  buildTimeFeatureFlags,
  buildTimeFeatures,
  buildTimePublicEnv,
} from "@/config/features-config";
import { FILE_UPLOAD_MAX_SIZE } from "@/config/file";
import { redirects } from "@/config/routes";
import { getDerivedSecrets } from "@/config/secrets";
import { withPlugins } from "@/config/with-plugins";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Add client-side feature flags
    ...buildTimeFeatureFlags,

    // Auto-mirrored public env vars from their non-prefixed counterparts
    // e.g. STRIPE_PUBLISHABLE_KEY -> NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ...buildTimePublicEnv,

    // Server-only secrets injected at build time. They will not be exposed to the client
    // unless prefixed with NEXT_PUBLIC_. Consumers should read via process.env on server.
    ...getDerivedSecrets(),
  },

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
    /*
     * Next.js 15+ Enhanced Image Optimization
     * Optimized for Core Web Vitals and performance
     */
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600, // 1 hour cache
  },

  /*
   * Redirects are located in the `src/config/routes.ts` file
   */
  redirects,

  /*
   * Enhanced Security Headers
   */
  async headers() {
    return Promise.resolve([
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ]);
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,

  /*
   * React configuration
   */
  reactStrictMode: true,

  /*
   * Source maps
   */
  productionBrowserSourceMaps: false,

  /*
   * Lint configuration
   */
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
   * Server External Packages
   * Externalize packages that cause bundling issues with Turbopack/Vercel
   */
  serverExternalPackages: [
    // Native module (transitive dep of @builder.io/react) that fails to compile on Vercel
    "isolated-vm",
  ],

  /*
   * Experimental configuration
   */
  experimental: {
    serverActions: {
      bodySizeLimit: FILE_UPLOAD_MAX_SIZE,
    },
    // @see: https://nextjs.org/docs/app/api-reference/next-config-js/viewTransition
    viewTransition: true,
    webVitalsAttribution: ["CLS", "LCP", "TTFB", "FCP", "FID"],

    // Optimized prefetching
    optimisticClientCache: true,

    /*
     * Optimize Package Imports - Enhanced Bundle Optimization
     */
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "@tabler/icons-react",
      "@fortawesome/fontawesome-svg-core",
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/react-fontawesome",
      "lucide-react",
      "date-fns",
      "framer-motion",
    ],

    /*
     * Client-side Router Cache Configuration
     */
    staleTimes: {
      dynamic: 90,
      static: 360, // 360 seconds for static routes
    },
  },

  /*
   * Miscellaneous configuration
   */
  devIndicators: {
    position: "bottom-left" as const,
  },

  typedRoutes: true,

  /*
   * Enhanced Logging Configuration
   * @see https://nextjs.org/docs/app/api-reference/next-config-js/logging
   */
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: process.env.NODE_ENV === "development",
    },
  },

  compiler: {
    // Remove console logs only in production, excluding error logs
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },

  /*
   * Bundle Size Optimization
   * Excludes heavy dependencies and dev tools from production bundles
   */
  outputFileTracingExcludes: {
    "*": [
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.stories.*",
      "**/tests/**",
      "**/.git/**",
      "**/.github/**",
      "**/.vscode/**",
      "**/.next/cache/**",
      "**/node_modules/typescript/**",
      "**/node_modules/@types/**",
      "**/node_modules/eslint/**",
      "**/node_modules/prettier/**",
      "**/node_modules/@playwright/**",
      "**/node_modules/typescript/lib/**",
      "**/node_modules/.cache/**",
      "**/node_modules/.store/**",
    ],
  },

  /*
   * Turbopack configuration
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
   */
  turbopack: {
    rules: {
      "*.(node|bin|html)": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};

/*
 * Apply Next.js configuration plugins using the withPlugins utility.
 * The utility handles loading and applying functions exported from files
 * in the specified directory (default: src/config/nextjs).
 */
export default withPlugins(nextConfig);
