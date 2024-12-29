import { db } from "@/server/db";
import "@testing-library/jest-dom";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, expect, vi } from "vitest";

// Extend Vitest's expect method with testing-library methods
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

beforeAll(async () => {
	// Verify database connection
	try {
		await db.execute(sql`SELECT 1`);
		console.log("✓ Database connection successful");
	} catch (error) {
		console.error("✕ Database connection failed:", error);
		throw error;
	}

	// Suppress console errors during tests
	const originalError = console.error;
	console.error = (...args: unknown[]) => {
		if (
			typeof args[0] === "string" &&
			args[0].includes("Warning: ReactDOM.render is no longer supported")
		) {
			return;
		}
		originalError.call(console, ...args);
	};
});

afterAll(async () => {
	// Clean up database
	try {
		await db.execute(sql`SELECT 1`);
		console.log("✓ Database cleanup successful");
	} catch (error) {
		console.error("✕ Database cleanup failed:", error);
	}
});

/*
 * Mock Next.js router
 * This is needed for components that use useRouter
 */
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		pathname: "/",
		query: {},
	}),
	usePathname: () => "/",
	useSearchParams: () => new URLSearchParams(),
}));

/*
 * Mock Next.js image component
 * This is needed for components that use next/image
 */
vi.mock("next/image", () => ({
	__esModule: true,
	default: vi.fn().mockImplementation(() => null),
}));
