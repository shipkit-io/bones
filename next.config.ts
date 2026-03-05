import type { NextConfig } from "next";
import {
  buildTimeFeatureFlags,
  buildTimeFeatures,
  buildTimePublicEnv,
} from "@/config/features-config";
import { FILE_UPLOAD_MAX_SIZE } from "@/config/file";
import { getDerivedSecrets } from "@/config/secrets";
import { withPlugins } from "@/config/with-plugins";
import { POSTHOG_RELAY_SLUG } from "@/lib/posthog/posthog-config";
import { redirects } from "@/config/redirects";

/** @type {import('next').NextConfig} */
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

    // You can add other build-time env variables here if needed
  },

  /*
   * Next.js configuration
   */
  images: {
    remotePatterns: [
      { hostname: "shipkit.io" }, // @dev: for testing
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
      {
        protocol: "https",
        hostname: "shipkit.s3.**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "better-auth.com",
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
    // dangerouslyAllowSVG: true,
    // contentDispositionType: "attachment",
    // contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  /* Redirects — see src/config/redirects.ts */
  redirects,

  /*
   * PostHog reverse proxy configuration
   */
  rewrites() {
    return Promise.resolve([
      {
        source: `/${POSTHOG_RELAY_SLUG}/static/:path*`,
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: `/${POSTHOG_RELAY_SLUG}/:path*`,
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: `/${POSTHOG_RELAY_SLUG}/flags`,
        destination: "https://us.i.posthog.com/flags",
      },
    ]);
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  async headers() {
    return Promise.resolve([
      // /install
      {
        source: "/install",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
      /*
       * Enhanced Security Headers
       * Adds Content Security Policy for better security
       */
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
          // @production
          // {
          // 	key: "Permissions-Policy",
          // 	value: "camera=(), microphone=(), geolocation=()",
          // },
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
   * Source maps - DISABLED to reduce memory usage during build
   * Enable only in development or when specifically needed
   */
  productionBrowserSourceMaps: false,

  typescript: {
    /*
	  !! WARNING !!
	  * Dangerously allow production builds to successfully complete even if
	  * your project has type errors.
	*/
    ignoreBuildErrors: true,
  },

  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  /*
   * Server External Packages
   * Externalize packages that cause bundling issues with Turbopack/Vercel:
   * - Native modules, optional DB drivers, AWS SDK, Payload CMS packages with CSS imports
   */
  serverExternalPackages: [
    // Native module (transitive dep of @builder.io/react) that fails to compile on Vercel
    "isolated-vm",
    // Drizzle Kit - CLI tool bundled by Payload CMS that has many optional drivers
    "drizzle-kit",
    // Optional Drizzle ORM database drivers
    "@aws-sdk/client-rds-data",
    "@electric-sql/pglite",
    "@libsql/client",
    "@neondatabase/serverless",
    "@planetscale/database",
    "@vercel/postgres",
    "better-sqlite3",
    "mysql2",

    // ESM-only packages that need to be externalized
    "@octokit/rest",
  ],

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

    // nextScriptWorkers: true, // Disabled - causes __non_webpack_require__ warnings with Turbopack
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
     * Automatically optimizes imports from large libraries like Lodash, Material-UI, etc.
     */
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "@tabler/icons-react",
      "@fortawesome/fontawesome-svg-core",
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/react-fontawesome",
      "lucide-react",
      "date-fns",
      "lodash-es",
      "@mantine/hooks",
      "framer-motion",
    ],

    /*
     * Client-side Router Cache Configuration
     * Optimizes navigation performance by caching page segments
     */
    staleTimes: {
      dynamic: buildTimeFeatures.PAYLOAD_ENABLED ? 0 : 90, // Payload needs to be re-rendered on every request
      static: 360, // 360 seconds for static routes
    },

    // Memory optimization for builds - Uncomment if experiencing memory issues
    // webpackBuildWorker: false, // Disable for low memory
    // cpus: 1, // Limit concurrent operations
    // workerThreads: false, // Disable worker threads
    // ppr: true,
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
      fullUrl: true, // Log full URLs of fetch requests even if cached
      hmrRefreshes: process.env.NODE_ENV === "development", // Log HMR refreshes in development
    },
  },

  compiler: {
    // Logs are disabled in production unless DISABLE_LOGGING is set
    // Use DISABLE_LOGGING to disable all logging except error logs
    // Use DISABLE_ERROR_LOGGING to disable error logging too
    removeConsole:
      process.env.DISABLE_LOGGING === "true" ||
      (process.env.NODE_ENV === "production" && !process.env.DISABLE_LOGGING)
        ? process.env.DISABLE_ERROR_LOGGING === "true" ||
          (process.env.NODE_ENV === "production" &&
            !process.env.DISABLE_ERROR_LOGGING)
          ? true
          : { exclude: ["error"] }
        : false,
  },

  /*
   * Bundle Size Optimization - Enhanced
   * Excludes additional heavy dependencies and dev tools from production bundles
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
      "**/node_modules/typescript/**",
      "**/node_modules/react-syntax-highlighter/**",
      "**/node_modules/canvas-confetti/**",
      "**/node_modules/@huggingface/transformers/**",
      "**/node_modules/three/**",
      "**/node_modules/@react-three/**",
      "**/node_modules/jspdf/**",
      // Additional Next.js 15 optimizations
      "**/node_modules/monaco-editor/**",
      "**/node_modules/@playwright/**",
      "**/node_modules/typescript/lib/**",
      // Exclude more heavy dependencies
      "**/node_modules/remotion/**",
      "**/node_modules/@opentelemetry/**",
      "**/node_modules/googleapis/**",
      "**/node_modules/@tsparticles/**",
      "**/node_modules/marked/**",
      "**/node_modules/remark/**",
      "**/node_modules/rehype/**",
      // Additional memory-heavy dependencies
      // "**/node_modules/onnxruntime-node/**",
      // "**/node_modules/onnxruntime-web/**",
      "**/node_modules/@tabler/**",
      "**/node_modules/@stackframe/**",
      "**/node_modules/@doubletie/**",
      "**/node_modules/mathjax-full/**",
      "**/node_modules/@sentry/**",
      "**/node_modules/@aws-sdk/**",
      "**/node_modules/@webcontainer/**",
      "**/node_modules/.cache/**",
      "**/node_modules/.store/**",
    ],
  },
  outputFileTracingIncludes: {
    "*": ["./docs/**/*", "./src/content/**/*"],
  },

  /*
   * Turbopack configuration (stable in Next.js 16)
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
   */
  turbopack: {
    rules: {
      // Handle raw file types
      "*.(node|bin|html)": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
      // Handle MDX files for docs
      "*.mdx": {
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
