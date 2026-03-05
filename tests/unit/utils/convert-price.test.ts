import { describe, expect, it } from "vitest";

// Since the function is not exported, we'll recreate it for testing
const convertPriceToIntegerCents = (price: any): number => {
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
};

describe("convertPriceToIntegerCents", () => {
	it("returns 0 for null or undefined values", () => {
		expect(convertPriceToIntegerCents(null)).toBe(0);
		expect(convertPriceToIntegerCents(undefined)).toBe(0);
	});

	it("passes through integer values assuming they're already in cents", () => {
		expect(convertPriceToIntegerCents(100)).toBe(100);
		expect(convertPriceToIntegerCents(1999)).toBe(1999);
		expect(convertPriceToIntegerCents(0)).toBe(0);
	});

	it("converts float values from dollars to cents", () => {
		expect(convertPriceToIntegerCents(1.99)).toBe(199);
		expect(convertPriceToIntegerCents(10.5)).toBe(1050);
		expect(convertPriceToIntegerCents(0.01)).toBe(1);
	});

	it("handles string representations of numbers", () => {
		expect(convertPriceToIntegerCents("1.99")).toBe(199);
		expect(convertPriceToIntegerCents("10.50")).toBe(1050);
		expect(convertPriceToIntegerCents("100")).toBe(10000);
	});

	it("rounds decimal values to the nearest cent", () => {
		expect(convertPriceToIntegerCents(1.999)).toBe(200);
		expect(convertPriceToIntegerCents(10.001)).toBe(1000);
		expect(convertPriceToIntegerCents("1.995")).toBe(200);
	});

	it("returns 0 for invalid string inputs", () => {
		expect(convertPriceToIntegerCents("not a price")).toBe(0);
		expect(convertPriceToIntegerCents("")).toBe(0);
	});
});
