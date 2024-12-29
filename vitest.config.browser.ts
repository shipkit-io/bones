import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		include: ["tests/browser/**/*.test.{ts,tsx}"],
		watch: false,
		browser: {
			enabled: true,
			name: "chromium",
			provider: "playwright",
			// https://playwright.dev
			providerOptions: {},
		},
	},
});
