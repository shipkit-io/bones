import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Local implementations for testing
function getEnvVar(name: string, defaultValue = ""): string {
	return process.env[name] || defaultValue;
}

function getBooleanEnvVar(name: string, defaultValue = false): boolean {
	const value = process.env[name];
	if (value === undefined) return defaultValue;
	return value === "true" || value === "1";
}

function getNumericEnvVar(name: string, defaultValue = 0): number {
	const value = process.env[name];
	if (value === undefined) return defaultValue;

	const parsed = Number(value);
	return Number.isNaN(parsed) ? defaultValue : parsed;
}

function isFeatureEnabled(featureName: string, defaultValue = false): boolean {
	return getBooleanEnvVar(`FEATURE_${featureName.toUpperCase()}_ENABLED`, defaultValue);
}

describe("environment utilities", () => {
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

	describe("getEnvVar", () => {
		it("returns environment variable when it exists", () => {
			process.env.TEST_VAR = "test-value";
			expect(getEnvVar("TEST_VAR")).toBe("test-value");
		});

		it("returns default value when environment variable doesn't exist", () => {
			expect(getEnvVar("NON_EXISTENT_VAR", "default-value")).toBe("default-value");
		});

		it("returns empty string as default when not specified", () => {
			expect(getEnvVar("NON_EXISTENT_VAR")).toBe("");
		});
	});

	describe("getBooleanEnvVar", () => {
		it("returns true for 'true' string value", () => {
			process.env.BOOL_VAR = "true";
			expect(getBooleanEnvVar("BOOL_VAR")).toBe(true);
		});

		it("returns true for '1' string value", () => {
			process.env.BOOL_VAR = "1";
			expect(getBooleanEnvVar("BOOL_VAR")).toBe(true);
		});

		it("returns false for other string values", () => {
			process.env.BOOL_VAR = "false";
			expect(getBooleanEnvVar("BOOL_VAR")).toBe(false);

			process.env.BOOL_VAR = "0";
			expect(getBooleanEnvVar("BOOL_VAR")).toBe(false);

			process.env.BOOL_VAR = "anything";
			expect(getBooleanEnvVar("BOOL_VAR")).toBe(false);
		});

		it("returns default value when environment variable doesn't exist", () => {
			expect(getBooleanEnvVar("NON_EXISTENT_VAR", true)).toBe(true);
			expect(getBooleanEnvVar("NON_EXISTENT_VAR", false)).toBe(false);
		});

		it("returns false as default when not specified", () => {
			expect(getBooleanEnvVar("NON_EXISTENT_VAR")).toBe(false);
		});
	});

	describe("getNumericEnvVar", () => {
		it("returns numeric value for valid number string", () => {
			process.env.NUM_VAR = "42";
			expect(getNumericEnvVar("NUM_VAR")).toBe(42);

			process.env.NUM_VAR = "3.14";
			expect(getNumericEnvVar("NUM_VAR")).toBe(3.14);

			process.env.NUM_VAR = "-10";
			expect(getNumericEnvVar("NUM_VAR")).toBe(-10);
		});

		it("returns default value for invalid number string", () => {
			process.env.NUM_VAR = "not-a-number";
			expect(getNumericEnvVar("NUM_VAR", 99)).toBe(99);
		});

		it("returns default value when environment variable doesn't exist", () => {
			expect(getNumericEnvVar("NON_EXISTENT_VAR", 123)).toBe(123);
		});

		it("returns 0 as default when not specified", () => {
			expect(getNumericEnvVar("NON_EXISTENT_VAR")).toBe(0);
		});
	});

	describe("isFeatureEnabled", () => {
		it("returns true when feature flag is set to true", () => {
			process.env.FEATURE_TEST_ENABLED = "true";
			expect(isFeatureEnabled("test")).toBe(true);
		});

		it("returns false when feature flag is set to false", () => {
			process.env.FEATURE_TEST_ENABLED = "false";
			expect(isFeatureEnabled("test")).toBe(false);
		});

		it("handles lowercase feature names by converting to uppercase", () => {
			process.env.FEATURE_LOWERCASETEST_ENABLED = "true";
			expect(isFeatureEnabled("lowercaseTest")).toBe(true);
		});

		it("returns default value when feature flag is not set", () => {
			expect(isFeatureEnabled("non_existent", true)).toBe(true);
			expect(isFeatureEnabled("non_existent", false)).toBe(false);
		});

		it("returns false as default when not specified", () => {
			expect(isFeatureEnabled("non_existent")).toBe(false);
		});
	});
});
