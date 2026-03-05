import "@testing-library/jest-dom";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, expect, vi } from "vitest";

// Augment the global namespace for TypeScript
declare global {
	// biome-ignore lint/style/noVar: <explanation>
	var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// Set React testing environment
global.IS_REACT_ACT_ENVIRONMENT = true;

// Extend Vitest's expect method with testing-library methods
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

// Mock database module only if needed for specific tests
// This allows tests to run without a database connection
vi.mock("@/server/db", () => ({
	db: undefined,
	isDatabaseInitialized: async () => false,
	safeDbExecute: async (callback: Function, defaultValue: any) => defaultValue,
}));

// Suppress specific console errors during tests
beforeAll(async () => {
	const originalError = console.error;
	console.error = (...args: unknown[]) => {
		if (
			typeof args[0] === "string" &&
			(args[0].includes("Warning: ReactDOM.render is no longer supported") ||
				args[0].includes("Invariant: AsyncLocalStorage accessed in runtime"))
		) {
			return;
		}
		originalError.call(console, ...args);
	};
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
