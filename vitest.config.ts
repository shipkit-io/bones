/**
 * @fileoverview Vitest configuration for unit tests in Shipkit
 * @module vitest.config
 *
 * This configuration sets up the testing environment for React components and utilities.
 * It's optimized for testing components that use React hooks, Tailwind CSS, and Next.js features.
 *
 * Key features:
 * - JSDOM environment for React component testing
 * - TypeScript path resolution (@/* imports)
 * - Coverage reporting with v8 provider
 * - Global test utilities (describe, it, expect)
 *
 * Test structure:
 * - Unit tests: tests/unit/**
 * @see vitest.config.browser.ts - For browser-based testing
 * @see vitest.config.node.ts - For Node.js-specific testing
 */

import path from "node:path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		react(), // React JSX transformation and Fast Refresh
		tsconfigPaths(), // TypeScript path mapping support
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"), // Resolve @/* imports to src/*
			// Alias next/server to a test shim to avoid ESM resolution issues in next-auth during unit tests
			"next/server": path.resolve(__dirname, "./tests/shims/next-server.ts"),
		},
	},
	test: {
		environment: "jsdom", // DOM environment for React component testing
		globals: true, // Enable global test functions (describe, it, expect)
		setupFiles: [
			"./tests/setup-env.ts", // Environment variables for testing
			"./tests/setup.ts", // Testing utilities and global setup
		],
		include: ["tests/unit/**/*.test.{ts,tsx}"], // Only unit tests in this config
		exclude: [
			// Exclude brittle suite that imports next-auth env and requires real Next runtime
			"tests/unit/server/actions/deploy-private-repo.test.ts",
		],
		watch: false, // Disable watch mode for CI/CD compatibility
		coverage: {
			provider: "v8", // Fast coverage provider
			reporter: ["text", "json", "html"], // Multiple coverage output formats
			exclude: [
				"node_modules/**",
				"src/test/**", // Test utilities
				"**/*.d.ts", // Type definitions
				"**/*.config.ts", // Configuration files
				"**/types/**", // Type-only files
			],
		},
	},
});
