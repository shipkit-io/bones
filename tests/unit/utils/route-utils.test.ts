import type { Route } from "next";
import { describe, expect, it } from "vitest";
import type { RouteObject } from "@/config/routes";
import { getRoutePath, rx } from "@/lib/utils/route-utils";

describe("route-utils", () => {
	describe("getRoutePath", () => {
		it("should return the path string directly if route is a string", () => {
			const route: Route = "/users/profile";
			expect(getRoutePath(route)).toBe("/users/profile");
		});

		it("should return the path from a RouteObject if no params are needed", () => {
			const route: RouteObject = { path: "/products", name: "Products" };
			expect(getRoutePath(route)).toBe("/products");
		});

		it("should replace parameters in the path using provided params", () => {
			const route: RouteObject = { path: "/users/:userId/posts/:postId", name: "User Post" };
			const params = { userId: "123", postId: "456" };
			expect(getRoutePath(route, params)).toBe("/users/123/posts/456");
		});

		it("should use default parameters if provided params are missing", () => {
			const route: RouteObject = {
				path: "/items/:itemId",
				name: "Item",
				params: { itemId: "default-item" },
			};
			expect(getRoutePath(route, {})).toBe("/items/default-item");
		});

		it("should prioritize provided params over default params", () => {
			const route: RouteObject = {
				path: "/items/:itemId",
				name: "Item",
				params: { itemId: "default-item" },
			};
			const params = { itemId: "specific-item" };
			expect(getRoutePath(route, params)).toBe("/items/specific-item");
		});

		it("should handle mixed provided and default params", () => {
			const route: RouteObject = {
				path: "/orgs/:orgId/users/:userId",
				name: "Org User",
				params: { userId: "default-user" },
			};
			const params = { orgId: "abc-org" };
			expect(getRoutePath(route, params)).toBe("/orgs/abc-org/users/default-user");
		});

		it("should handle params with null default values if not provided", () => {
			const route: RouteObject = {
				path: "/optional/:maybeId?",
				name: "Optional Param",
				params: { maybeId: null }, // Default is null
			};
			// No param provided, should likely keep the placeholder or handle it as defined (here it's kept)
			expect(getRoutePath(route, {})).toBe("/optional/:maybeId?"); // Or perhaps "/optional/" depending on desired behavior for nulls
		});

		it("should handle params with null default values when provided", () => {
			const route: RouteObject = {
				path: "/optional/:maybeId?",
				name: "Optional Param",
				params: { maybeId: null }, // Default is null
			};
			const params = { maybeId: "provided-id" };
			expect(getRoutePath(route, params)).toBe("/optional/provided-id?");
		});

		it("should handle numeric params", () => {
			const route: RouteObject = { path: "/entity/:id", name: "Entity" };
			const params = { id: 999 };
			expect(getRoutePath(route, params)).toBe("/entity/999");
		});
	});

	describe("rx", () => {
		// Assuming the routes object from src/config/routes.ts is implicitly used
		it("should resolve a simple top-level route string", () => {
			expect(rx("home")).toBe("/");
			expect(rx("pricing")).toBe("/pricing");
		});

		it("should resolve a nested route string", () => {
			expect(rx("auth.signIn")).toBe("/sign-in");
			expect(rx("admin.users")).toBe("/admin/users");
		});

		it("should resolve a nested route with an index property", () => {
			// Assuming cms.index resolves to '/cms'
			expect(rx("cms")).toBe("/cms");
		});

		it("should resolve a route object with parameters using provided params", () => {
			// Corresponds to: api: { apiKey: createRoute("/api/api-keys/:key", { key: null }) }
			expect(rx("api.apiKey", { key: "test-key-123" })).toBe("/api/api-keys/test-key-123");
		});

		it("should use default parameter value if param not provided", () => {
			// Corresponds to: api: { apiKey: createRoute("/api/api-keys/:key", { key: null }) }
			// Since the default is null, the behavior depends on getRoutePath (keeps placeholder)
			expect(rx("api.apiKey", {})).toBe("/api/api-keys/:key");
		});

		it("should throw an error for an invalid path", () => {
			expect(() => rx("invalid.path.does.not.exist" as any)).toThrow(
				"Route not found: invalid.path.does.not.exist"
			);
		});

		it("should throw an error if a part of the path is not an object/string", () => {
			// Need to mock or adjust routes structure slightly for this test case if needed
			// Example: If routes.home was an object without a 'path' or 'index'
			expect(() => rx("home.invalidPart" as any)).toThrow(); // Adjust error message based on actual behavior
		});

		it.skip("should handle deeply nested paths", () => {
			expect(rx("examples.forms.notifications")).toBe("/examples/forms/notifications");
		});
	});

	// Add tests for `rx` function later if needed
});
