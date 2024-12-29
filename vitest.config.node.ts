import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		environment: "node",
		globals: true,
		setupFiles: ["./tests/setup-env.ts", "./tests/setup.ts"],
		include: ["tests/server/**/*.test.{ts,tsx}"],
		watch: false,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/**",
				"src/test/**",
				"**/*.d.ts",
				"**/*.config.ts",
				"**/types/**",
			],
		},
	},
});
