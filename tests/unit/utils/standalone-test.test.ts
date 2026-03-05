import { describe, expect, it } from "vitest";

// Local implementations for testing

// Capitalize utility
function capitalize(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

// Levenshtein distance utility
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];

	// Initializing matrix
	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}

	for (let i = 0; i <= a.length; i++) {
		matrix[0][i] = i;
	}

	// Calculate Levenshtein distance
	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					matrix[i][j - 1] + 1, // insertion
					matrix[i - 1][j] + 1 // deletion
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

// Extract component ID utility
// function extractComponentId(input: string): string | null {
// 	// If input is already just an ID (b_XXXXXX)
// 	if (/^b_[a-zA-Z0-9]+$/.test(input)) {
// 		return input;
// 	}
//
// 	// If input is a URL, extract the ID
// 	const urlMatch = input.match(/https?:\/\/v0\.dev\/(?:chat\/)?b\/([a-zA-Z0-9_]+)/);
// 	return urlMatch?.[1] || null;
// }

// Price conversion utility
function convertPriceToIntegerCents(price: any): number {
	if (price === null || price === undefined) return 0;

	// If it's already an integer, assume it's already in cents
	if (Number.isInteger(price)) return price;

	// If it's a number but not an integer, assume it's in dollars and convert to cents
	if (typeof price === "number") {
		return Math.round(price * 100);
	}

	// If it's a string, parse it and convert to cents
	if (typeof price === "string") {
		const parsedPrice = Number.parseFloat(price);
		if (!Number.isNaN(parsedPrice)) {
			return Math.round(parsedPrice * 100);
		}
	}

	// If we can't determine the format, return 0
	return 0;
}

// Path sanitization utility
function sanitizePath(filePath: string): string {
	return filePath.replace(/\.\./g, "").replace(/^\/+/, "");
}

describe("utility functions", () => {
	describe("capitalize", () => {
		it("capitalizes the first letter of a string", () => {
			expect(capitalize("hello")).toBe("Hello");
			expect(capitalize("world")).toBe("World");
		});

		it("returns empty string when given empty string", () => {
			expect(capitalize("")).toBe("");
		});

		it("doesn't change already capitalized strings", () => {
			expect(capitalize("Hello")).toBe("Hello");
			expect(capitalize("World")).toBe("World");
		});
	});

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
			expect(levenshteinDistance("cat", "hat")).toBe(1);
			expect(levenshteinDistance("cat", "cats")).toBe(1);
			expect(levenshteinDistance("cats", "cat")).toBe(1);
		});
	});

	describe("convertPriceToIntegerCents", () => {
		it("returns 0 for null or undefined values", () => {
			expect(convertPriceToIntegerCents(null)).toBe(0);
			expect(convertPriceToIntegerCents(undefined)).toBe(0);
		});

		it("passes through integer values assuming they're already in cents", () => {
			expect(convertPriceToIntegerCents(100)).toBe(100);
			expect(convertPriceToIntegerCents(1999)).toBe(1999);
		});

		it("converts float values from dollars to cents", () => {
			expect(convertPriceToIntegerCents(1.99)).toBe(199);
			expect(convertPriceToIntegerCents(10.5)).toBe(1050);
		});

		it("handles string representations of numbers", () => {
			expect(convertPriceToIntegerCents("1.99")).toBe(199);
			expect(convertPriceToIntegerCents("10.50")).toBe(1050);
		});
	});

	describe("sanitizePath", () => {
		it("removes parent directory traversal attacks", () => {
			expect(sanitizePath("../../etc/passwd")).toBe("etc/passwd");
			expect(sanitizePath("../config/secrets.txt")).toBe("config/secrets.txt");
		});

		it("removes leading slashes", () => {
			expect(sanitizePath("/path/to/file")).toBe("path/to/file");
			expect(sanitizePath("///multiple/slashes")).toBe("multiple/slashes");
		});

		it("handles paths with no security issues", () => {
			expect(sanitizePath("normal/path/file.txt")).toBe("normal/path/file.txt");
			expect(sanitizePath("file.txt")).toBe("file.txt");
		});
	});
});
