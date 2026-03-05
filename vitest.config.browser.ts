import react from "@vitejs/plugin-react";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		include: ["tests/browser/**/*.test.{ts,tsx}"],
		watch: false,
		setupFiles: ["./tests/setup-env.ts", "./tests/setup.ts"],
		browser: {
			enabled: true,
			name: "chromium",
			provider: "playwright",
		},
	},
});
