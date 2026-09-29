// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The feature flags are optional booleans: unset is `undefined`, and an explicit
 * `=false` in the environment is `false`. A `??` chain over them stops at the
 * first non-nullish value, so a deployment that turns Resend off explicitly and
 * GitHub on used to fall all the way through to guest mode with no auth at all.
 *
 * Runs in the node environment so `AUTH_STRATEGY` (a server variable) is read;
 * the browser side only sees its `NEXT_PUBLIC_` mirror.
 */

type Flags = Record<string, boolean | string | undefined>;

const loadStrategy = async (flags: Flags) => {
  vi.resetModules();
  vi.doMock("@/env", () => ({ env: flags }));
  return await import("@/lib/auth/auth-strategy");
};

describe("getAuthStrategy", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/env");
  });

  it("reports guest mode when nothing is configured", async () => {
    const { getAuthStrategy, isAuthenticationAvailable } = await loadStrategy({});
    expect(getAuthStrategy()).toBe("guest");
    expect(isAuthenticationAvailable()).toBe(false);
  });

  it("reports authjs when a provider is enabled", async () => {
    const { getAuthStrategy, isAuthJSActive } = await loadStrategy({
      NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
    });
    expect(getAuthStrategy()).toBe("authjs");
    expect(isAuthJSActive()).toBe(true);
  });

  it("still reports authjs when an earlier provider is explicitly disabled", async () => {
    const { getAuthStrategy } = await loadStrategy({
      NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
    });
    expect(getAuthStrategy()).toBe("authjs");
  });

  it("reports guest when every provider is explicitly disabled", async () => {
    const { getAuthStrategy, isGuestModeActive } = await loadStrategy({
      NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED: false,
    });
    expect(getAuthStrategy()).toBe("guest");
    expect(isGuestModeActive()).toBe(true);
  });

  describe("Clerk", () => {
    it("is never picked from the keys alone", async () => {
      const { getAuthStrategy, isClerkActive } = await loadStrategy({
        NEXT_PUBLIC_FEATURE_AUTH_CLERK_ENABLED: true,
        NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
      });
      expect(getAuthStrategy()).toBe("better-auth");
      expect(isClerkActive()).toBe(false);
    });

    it("is active with AUTH_STRATEGY=clerk and both keys", async () => {
      const { getAuthStrategy, isClerkActive, isAuthenticationAvailable } = await loadStrategy({
        AUTH_STRATEGY: "clerk",
        NEXT_PUBLIC_FEATURE_AUTH_CLERK_ENABLED: true,
        NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
        NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
      });
      expect(getAuthStrategy()).toBe("clerk");
      expect(isClerkActive()).toBe(true);
      expect(isAuthenticationAvailable()).toBe(true);
    });

    it("honours the NEXT_PUBLIC mirror the client bundle receives", async () => {
      const { getAuthStrategy } = await loadStrategy({
        NEXT_PUBLIC_AUTH_STRATEGY: "clerk",
        NEXT_PUBLIC_FEATURE_AUTH_CLERK_ENABLED: true,
      });
      expect(getAuthStrategy()).toBe("clerk");
    });

    it("falls through when selected but the keys are missing", async () => {
      const { getAuthStrategy, isClerkActive } = await loadStrategy({
        AUTH_STRATEGY: "clerk",
        NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
      });
      expect(getAuthStrategy()).toBe("authjs");
      expect(isClerkActive()).toBe(false);
    });

    it("does not let the Better Auth default in when clerk is selected but unconfigured", async () => {
      const { getAuthStrategy } = await loadStrategy({
        AUTH_STRATEGY: "clerk",
        NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
      });
      expect(getAuthStrategy()).toBe("guest");
    });
  });

  describe("Better Auth", () => {
    it("is the default when configured and nothing Auth.js-specific is set", async () => {
      const { getAuthStrategy, isBetterAuthActive, isAuthJSActive } = await loadStrategy({
        NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
        NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
      });
      expect(getAuthStrategy()).toBe("better-auth");
      expect(isBetterAuthActive()).toBe(true);
      expect(isAuthJSActive()).toBe(false);
    });

    it("yields to Auth.js by default when the Payload credentials provider is on", async () => {
      const { getAuthStrategy } = await loadStrategy({
        NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
        NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: true,
      });
      expect(getAuthStrategy()).toBe("authjs");
    });

    it("yields to Auth.js by default when NEXTAUTH_SESSION_STRATEGY is set", async () => {
      const { getAuthStrategy } = await loadStrategy({
        NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
        NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
        NEXTAUTH_SESSION_STRATEGY: "database",
      });
      expect(getAuthStrategy()).toBe("authjs");
    });

    it("wins over every Auth.js signal when AUTH_STRATEGY=better-auth", async () => {
      const { getAuthStrategy } = await loadStrategy({
        AUTH_STRATEGY: "better-auth",
        NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
        NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: true,
        NEXTAUTH_SESSION_STRATEGY: "jwt",
      });
      expect(getAuthStrategy()).toBe("better-auth");
    });

    it("honours the NEXT_PUBLIC mirror the client bundle receives", async () => {
      const { getAuthStrategy } = await loadStrategy({
        NEXT_PUBLIC_AUTH_STRATEGY: "better-auth",
        NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
        NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: true,
      });
      expect(getAuthStrategy()).toBe("better-auth");
    });

    it("cannot be selected when it is not configured", async () => {
      const { getAuthStrategy } = await loadStrategy({
        AUTH_STRATEGY: "better-auth",
        NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: false,
        NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
      });
      expect(getAuthStrategy()).toBe("authjs");
    });

    it("falls to guest when selected but neither it nor a provider is configured", async () => {
      const { getAuthStrategy } = await loadStrategy({ AUTH_STRATEGY: "better-auth" });
      expect(getAuthStrategy()).toBe("guest");
    });

    it("stays off when AUTH_STRATEGY=authjs even though it is configured", async () => {
      const { getAuthStrategy, isBetterAuthActive } = await loadStrategy({
        AUTH_STRATEGY: "authjs",
        NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
        NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
      });
      expect(getAuthStrategy()).toBe("authjs");
      expect(isBetterAuthActive()).toBe(false);
    });

    it("reports guest under AUTH_STRATEGY=authjs with no provider", async () => {
      const { getAuthStrategy } = await loadStrategy({
        AUTH_STRATEGY: "authjs",
        NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
      });
      expect(getAuthStrategy()).toBe("guest");
    });
  });
});
