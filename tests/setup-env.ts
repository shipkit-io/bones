// Environment setup for tests
// This handles both browser and Node.js environments

// Set test-specific environment variables
process.env = {
	...process.env,
	NODE_ENV: "test",
	SKIP_ENV_VALIDATION: "1",
};

// Only load Next.js environment config in Node.js environment
// Browser environments already have environment variables processed at build time
if (typeof window === "undefined") {
	try {
		// Dynamic import to avoid browser compatibility issues
		import("@next/env")
			.then(({ loadEnvConfig }) => {
				loadEnvConfig(process.cwd());
			})
			.catch((error) => {
				console.warn("Error loading environment variables:", error);
			});

		// Patch next-auth test runtime when Next.js module pathing differs
		// Some versions expect next/server; in Vitest we can noop this
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			require.resolve("next/server");
		} catch {
			// Map bare import "next/server" to our JS shim so next-auth/env can import it safely
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const Module = require("module");
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const path = require("path");
			const originalResolve = Module._resolveFilename;
			const shimPath = path.resolve(__dirname, "./shims/next-server.js");
			Module._resolveFilename = function (
				request: string,
				parent: unknown,
				isMain: boolean,
				options: any
			) {
				if (request === "next/server") {
					return shimPath;
				}
				return originalResolve.call(this, request, parent, isMain, options);
			} as any;
		}
	} catch (error) {
		console.warn("Error importing @next/env:", error);
	}
}
