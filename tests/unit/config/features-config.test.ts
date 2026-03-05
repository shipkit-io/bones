import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Import the actual features-config to test real functionality
import { buildTimeFeatureFlags } from "../../../src/config/features-config";

// Create a test version of EnvChecker for testing
class TestEnvChecker {
	private static hasEnvVar(name: string): boolean {
		const value = process.env[name];
		return typeof value === "string" && value.trim().length > 0;
	}

	static isEnabled(name: string): boolean {
		const value = process.env[name]?.toLowerCase().trim();
		return ["true", "1", "yes", "on", "enable", "enabled"].includes(value || "");
	}

	static has(...names: string[]): boolean {
		return names.every((name) => TestEnvChecker.hasEnvVar(name));
	}

	static hasAny(...names: string[]): boolean {
		return names.some((name) => TestEnvChecker.hasEnvVar(name));
	}
}

describe("EnvChecker utility functions", () => {
	beforeEach(() => {
		// Clean up any existing test variables
		Object.keys(process.env).forEach((key) => {
			if (key.startsWith("TEST_")) {
				delete process.env[key];
			}
		});
	});

	afterEach(() => {
		// Clean up test variables
		Object.keys(process.env).forEach((key) => {
			if (key.startsWith("TEST_")) {
				delete process.env[key];
			}
		});
	});

	describe("has() method", () => {
		it("should return true for single existing non-empty variable", () => {
			process.env.TEST_VAR = "some-value";
			expect(TestEnvChecker.has("TEST_VAR")).toBe(true);
		});

		it("should return false for single undefined variable", () => {
			expect(TestEnvChecker.has("TEST_UNDEFINED")).toBe(false);
		});

		it("should return false for single empty string variable", () => {
			process.env.TEST_VAR = "";
			expect(TestEnvChecker.has("TEST_VAR")).toBe(false);
		});

		it("should return false for single whitespace-only variable", () => {
			process.env.TEST_VAR = "   ";
			expect(TestEnvChecker.has("TEST_VAR")).toBe(false);
		});

		it("should return true when all variables exist", () => {
			process.env.TEST_VAR1 = "value1";
			process.env.TEST_VAR2 = "value2";
			process.env.TEST_VAR3 = "value3";

			expect(TestEnvChecker.has("TEST_VAR1", "TEST_VAR2", "TEST_VAR3")).toBe(true);
		});

		it("should return false when any variable is missing", () => {
			process.env.TEST_VAR1 = "value1";
			process.env.TEST_VAR2 = "value2";

			expect(TestEnvChecker.has("TEST_VAR1", "TEST_VAR2", "TEST_VAR3")).toBe(false);
		});
	});

	describe("isEnabled() method", () => {
		const truthyValues = ["true", "1", "yes", "on", "enable", "enabled"];
		const falsyValues = ["false", "0", "no", "off", "disable", "disabled"];

		it("should handle truthy values correctly", () => {
			for (const value of truthyValues) {
				process.env.TEST_VAR = value;
				expect(TestEnvChecker.isEnabled("TEST_VAR")).toBe(true);

				// Test case insensitive
				process.env.TEST_VAR = value.toUpperCase();
				expect(TestEnvChecker.isEnabled("TEST_VAR")).toBe(true);
			}
		});

		it("should handle falsy values correctly", () => {
			for (const value of falsyValues) {
				process.env.TEST_VAR = value;
				expect(TestEnvChecker.isEnabled("TEST_VAR")).toBe(false);

				// Test case insensitive
				process.env.TEST_VAR = value.toUpperCase();
				expect(TestEnvChecker.isEnabled("TEST_VAR")).toBe(false);
			}
		});

		it("should handle undefined/empty variables", () => {
			delete process.env.TEST_VAR;
			expect(TestEnvChecker.isEnabled("TEST_VAR")).toBe(false);

			process.env.TEST_VAR = "";
			expect(TestEnvChecker.isEnabled("TEST_VAR")).toBe(false);
		});

		it("should handle unknown values as false", () => {
			process.env.TEST_VAR = "maybe";
			expect(TestEnvChecker.isEnabled("TEST_VAR")).toBe(false);

			process.env.TEST_VAR = "unknown";
			expect(TestEnvChecker.isEnabled("TEST_VAR")).toBe(false);
		});

		it("should handle whitespace correctly", () => {
			process.env.TEST_VAR = "  true  ";
			expect(TestEnvChecker.isEnabled("TEST_VAR")).toBe(true);

			process.env.TEST_VAR = "\t1\n";
			expect(TestEnvChecker.isEnabled("TEST_VAR")).toBe(true);

			process.env.TEST_VAR = "  false  ";
			expect(TestEnvChecker.isEnabled("TEST_VAR")).toBe(false);
		});
	});

	describe("hasAny() method", () => {
		it("should return true when at least one variable exists", () => {
			process.env.TEST_VAR1 = "value1";

			expect(TestEnvChecker.hasAny("TEST_VAR1", "TEST_VAR2", "TEST_VAR3")).toBe(true);
		});

		it("should return false when no variables exist", () => {
			expect(TestEnvChecker.hasAny("TEST_VAR1", "TEST_VAR2", "TEST_VAR3")).toBe(false);
		});
	});
});

describe("Feature flag generation", () => {
	beforeEach(() => {
		// Clean up any existing variables that might affect tests
		Object.keys(process.env).forEach((key) => {
			if (key.startsWith("TEST_") || key.includes("STRIPE") || key.includes("DATABASE")) {
				delete process.env[key];
			}
		});
	});

	it("should have the correct structure for build-time feature flags", () => {
		// Test the basic structure and types of the imported flags
		expect(typeof buildTimeFeatureFlags).toBe("object");

		// All values should be strings. Most are "true" (enabled-only export),
		// except the two always-exported flags which may be "false" when disabled.
		Object.entries(buildTimeFeatureFlags).forEach(([key, value]) => {
			expect(typeof value).toBe("string");
			if (
				key === "NEXT_PUBLIC_FEATURE_AUTH_ENABLED" ||
				key === "NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED"
			) {
				expect(["true", "false"]).toContain(value);
			} else {
				expect(value).toBe("true");
			}
		});
	});

	it("should have consistent feature naming for client flags", () => {
		const buildTimeKeys = Object.keys(buildTimeFeatureFlags);

		// Client flags should be prefixed with NEXT_PUBLIC_FEATURE_ and end with _ENABLED
		buildTimeKeys.forEach((key) => {
			expect(key.startsWith("NEXT_PUBLIC_FEATURE_")).toBe(true);
			expect(key.endsWith("_ENABLED")).toBe(true);
		});
	});

	it("should only include enabled features", () => {
		// Only enabled features should be present with value "true".
		// Two special flags are always exported and may be "false".
		Object.entries(buildTimeFeatureFlags).forEach(([key, value]) => {
			if (
				key === "NEXT_PUBLIC_FEATURE_AUTH_ENABLED" ||
				key === "NEXT_PUBLIC_FEATURE_AUTH_METHODS_ENABLED"
			) {
				expect(["true", "false"]).toContain(value);
			} else {
				expect(value).toBe("true");
			}
		});
	});
});
