import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the env module
vi.mock("@/env", () => ({
	env: {
		NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED: false,
		NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED: false,
		NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED: false,
		NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: false,
		NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED: false,
		NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED: false,
		NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: false,
		NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: false,
		NEXT_PUBLIC_FEATURE_AUTH_VERCEL_ENABLED: false,
	},
}));

describe("Auth Providers", () => {
	beforeEach(() => {
		// Clear module cache to ensure fresh imports
		vi.resetModules();
	});

	it("should enable guest authentication when explicitly enabled and no other methods are configured", async () => {
		vi.doMock("@/env", () => ({
			env: {
				NEXT_PUBLIC_FEATURE_AUTH_GUEST_ENABLED: true,
				NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_VERCEL_ENABLED: false,
			},
		}));

		const { availableProviderIds, isGuestOnlyMode } = await import("@/server/auth-providers");

		expect(availableProviderIds).toContain("guest");
		expect(isGuestOnlyMode).toBe(true);
	});

	it("should not enable guest authentication when other auth methods are configured", async () => {
		// Mock env with GitHub enabled
		vi.doMock("@/env", () => ({
			env: {
				NEXT_PUBLIC_FEATURE_AUTH_GUEST_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true, // Enable GitHub
				NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_VERCEL_ENABLED: false,
			},
		}));

		const { availableProviderIds, isGuestOnlyMode } = await import("@/server/auth-providers");

		expect(availableProviderIds).not.toContain("guest");
		expect(availableProviderIds).toContain("github");
		expect(isGuestOnlyMode).toBe(false);
	});

	it("should mark guest as excluded in UI providers list", async () => {
		const { enabledAuthProviders, EXCLUDED_PROVIDERS_UI } = await import("@/server/auth-providers");

		// Guest should be in the excluded list
		expect(EXCLUDED_PROVIDERS_UI).toContain("guest");

		// If guest provider exists in the list, it should be marked as excluded
		const guestProvider = enabledAuthProviders.find((p) => p.id === "guest");
		if (guestProvider) {
			expect(guestProvider.isExcluded).toBe(true);
		}
	});

	it("should enable guest when explicitly enabled and only vercel is configured (account linking only)", async () => {
		// Mock env with only Vercel enabled
		vi.doMock("@/env", () => ({
			env: {
				NEXT_PUBLIC_FEATURE_AUTH_GUEST_ENABLED: true,
				NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: false,
				NEXT_PUBLIC_FEATURE_AUTH_VERCEL_ENABLED: true, // Enable Vercel only
			},
		}));

		const { availableProviderIds, isGuestOnlyMode } = await import("@/server/auth-providers");

		// Should still enable guest since Vercel is for account linking only
		expect(availableProviderIds).toContain("guest");
		expect(availableProviderIds).toContain("vercel");
		expect(isGuestOnlyMode).toBe(true);
	});
});
