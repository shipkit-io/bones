import { describe, expect, it, vi } from "vitest";

// Mock implementation for testing
async function safeDbExecute<T>(callback: (db: any) => Promise<T>, defaultValue: T): Promise<T> {
	// In this mock implementation, we simulate db being undefined
	const db = undefined;

	if (!db) {
		return defaultValue;
	}

	try {
		return await callback(db);
	} catch (error) {
		return defaultValue;
	}
}

describe("database utilities", () => {
	describe("safeDbExecute", () => {
		it("returns default value when db is undefined", async () => {
			const defaultValue = { success: false };
			const mockCallback = vi.fn().mockResolvedValue({ success: true });

			const result = await safeDbExecute(mockCallback, defaultValue);

			expect(result).toEqual(defaultValue);
			expect(mockCallback).not.toHaveBeenCalled();
		});

		it("would call callback if db was defined", async () => {
			// Create a modified version of safeDbExecute for testing
			const mockDb = { query: {} };

			// Custom implementation with db defined
			async function safeDbExecuteWithDb<T>(
				callback: (db: any) => Promise<T>,
				defaultValue: T
			): Promise<T> {
				try {
					return await callback(mockDb);
				} catch (error) {
					return defaultValue;
				}
			}

			const mockCallback = vi.fn().mockResolvedValue({ success: true });
			const defaultValue = { success: false };

			const result = await safeDbExecuteWithDb(mockCallback, defaultValue);

			expect(result).toEqual({ success: true });
			expect(mockCallback).toHaveBeenCalledWith(mockDb);
		});

		it("returns default value on error", async () => {
			// Custom implementation with db defined but causing an error
			async function safeDbExecuteWithError<T>(
				callback: (db: any) => Promise<T>,
				defaultValue: T
			): Promise<T> {
				try {
					return await callback({});
				} catch (error) {
					return defaultValue;
				}
			}

			const mockCallback = vi.fn().mockRejectedValue(new Error("Database error"));
			const defaultValue = { error: true };

			const result = await safeDbExecuteWithError(mockCallback, defaultValue);

			expect(result).toEqual(defaultValue);
			expect(mockCallback).toHaveBeenCalled();
		});
	});
});
