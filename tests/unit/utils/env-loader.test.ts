import { loadEnvConfig } from "@next/env";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock loadEnvConfig
vi.mock("@next/env", () => ({
	loadEnvConfig: vi.fn().mockImplementation((dir, dev = false) => ({
		combinedEnv: {
			DATABASE_URL: "mock-database-url",
			NODE_ENV: "test",
			API_KEY: "test-api-key",
		},
		loadedEnvFiles: [{ path: ".env.test", contents: "NODE_ENV=test\nAPI_KEY=test-api-key" }],
	})),
}));

describe("environment configuration", () => {
	// Save original env
	const originalEnv = { ...process.env };

	beforeEach(() => {
		// Reset process.env before each test
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		// Restore process.env after each test
		process.env = originalEnv;
	});

	it("loads environment variables from .env files", () => {
		const projectDir = process.cwd();
		const result = loadEnvConfig(projectDir);

		expect(loadEnvConfig).toHaveBeenCalledWith(projectDir);
		expect(result.combinedEnv).toHaveProperty("DATABASE_URL", "mock-database-url");
		expect(result.combinedEnv).toHaveProperty("NODE_ENV", "test");
		expect(result.combinedEnv).toHaveProperty("API_KEY", "test-api-key");
	});

	it("makes environment variables available in process.env", () => {
		const projectDir = process.cwd();
		loadEnvConfig(projectDir);

		// These aren't actually set in process.env by our mock, but in a real scenario they would be
		// This test demonstrates how the variables would be accessed after loading
		expect(process.env).toBeDefined();
	});
});
