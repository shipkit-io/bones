import { describe, expect, it } from "vitest";
import { levenshteinDistance } from "@/app/(app)/install/shared-utils";

describe("levenshteinDistance", () => {
	it("returns 0 for identical strings", () => {
		expect(levenshteinDistance("", "")).toBe(0);
		expect(levenshteinDistance("a", "a")).toBe(0);
		expect(levenshteinDistance("hello", "hello")).toBe(0);
	});

	it("returns the length of the string for empty string comparison", () => {
		expect(levenshteinDistance("", "hello")).toBe(5);
		expect(levenshteinDistance("hello", "")).toBe(5);
	});

	it("calculates single character changes correctly", () => {
		// Substitution (1 change)
		expect(levenshteinDistance("cat", "hat")).toBe(1);

		// Insertion (1 change)
		expect(levenshteinDistance("cat", "cats")).toBe(1);

		// Deletion (1 change)
		expect(levenshteinDistance("cats", "cat")).toBe(1);
	});

	it("calculates distance for multiple changes", () => {
		// Multiple substitutions
		expect(levenshteinDistance("kitten", "sitting")).toBe(3);

		// Mixed operations
		expect(levenshteinDistance("saturday", "sunday")).toBe(3);
		expect(levenshteinDistance("hello world", "hallo wurld")).toBe(2);
	});

	it("handles case differences as changes", () => {
		expect(levenshteinDistance("hello", "Hello")).toBe(1);
		expect(levenshteinDistance("WORLD", "world")).toBe(5);
	});

	it("works with special characters", () => {
		expect(levenshteinDistance("café", "cafe")).toBe(1);
		expect(levenshteinDistance("über", "uber")).toBe(1);
	});
});
