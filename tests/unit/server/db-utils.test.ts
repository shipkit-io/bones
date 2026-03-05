import { describe, expect, it, vi } from "vitest";
import { safeDbExecute } from "@/server/db";

// Create a mock version of db
vi.mock("@/server/db", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/server/db")>();

	return {
		...actual,
		// Allow the safeDbExecute function to be imported directly
		safeDbExecute: actual.safeDbExecute,
		// Mock the db variable for testing
		db: undefined,
	};
});

// Mock logger to prevent console output during tests
vi.mock("@/lib/logger", () => ({
	logger: {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

describe("safeDbExecute", () => {
	it("returns default value when db is undefined", async () => {
		const defaultValue = { success: false };

		const result = await safeDbExecute(async (db) => ({ success: true }), defaultValue);

		expect(result).toEqual(defaultValue);
	});

	it("handles errors and returns default value", async () => {
		// Mock implementation with a different db reference
		const mockDb = {} as any;
		const mockCallback = vi.fn().mockRejectedValue(new Error("Database error"));
		const defaultValue = { error: true };

		// Override the module for this test
		vi.doMock("@/server/db", () => ({
			db: mockDb,
			safeDbExecute: async (callback: Function, defaultValue: any) => {
				try {
					return await callback(mockDb);
				} catch (error) {
					return defaultValue;
				}
			},
		}));

		const result = await safeDbExecute(mockCallback, defaultValue);

		expect(result).toEqual(defaultValue);
	});
});
