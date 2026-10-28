/**
 * Regression test for the `user.email!` removals in the `signIn` callback.
 *
 * The callback used to pass `user.email!` into `userService.ensureUserExists`.
 * When the address was actually absent, that call threw inside the service and
 * the surrounding `catch` swallowed it, so the sign-in was allowed anyway. The
 * assertion is gone and the callback now skips the sync explicitly, which is
 * the one line in this change that turned an assumption into a runtime branch.
 *
 * These pin both halves of that behavior: an address-less sign-in still
 * succeeds and no longer calls the service, and a normal sign-in still syncs.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const ensureUserExists = vi.fn(() => Promise.resolve({ id: "user-1" }));
const warn = vi.fn();

vi.mock("@/server/services/user-service", () => ({
  userService: {
    ensureUserExists: (...args: unknown[]) => ensureUserExists(...args),
  },
}));

vi.mock("@/server/auth-js/auth-providers.config", () => ({ providers: [] }));
vi.mock("@/server/db", () => ({ db: undefined }));
vi.mock("@/server/db/schema", () => ({ users: {} }));
vi.mock("@/server/services/admin-service", () => ({ isAdmin: () => Promise.resolve(false) }));
vi.mock("@/server/services/github/github-service", () => ({
  grantGitHubAccess: () => Promise.resolve(),
  pendingCollaboratorEmail: () => Promise.resolve(),
}));
vi.mock("@/lib/logger", () => ({
  logger: { warn, error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const loadSignIn = async () => {
  const { authOptions } = await import("@/server/auth-js/auth.config");
  const signIn = authOptions.callbacks?.signIn;
  if (!signIn) throw new Error("auth.config no longer defines a signIn callback");
  return signIn;
};

describe("signIn callback user sync", () => {
  beforeEach(() => {
    ensureUserExists.mockClear();
    warn.mockClear();
  });

  it("allows the sign-in and skips the sync when the user has no email", async () => {
    const signIn = await loadSignIn();

    const result = await signIn({
      user: { id: "user-1", email: null, name: "No Address" },
      account: { provider: "nodemailer", providerAccountId: "x", type: "email" },
    } as Parameters<typeof signIn>[0]);

    expect(result).toBe(true);
    expect(ensureUserExists).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      "Sign-in user has no email address, skipping Shipkit user sync",
      expect.objectContaining({ userId: "user-1" })
    );
  });

  it("still syncs the user when an email is present", async () => {
    const signIn = await loadSignIn();

    const result = await signIn({
      user: { id: "user-2", email: "person@example.com", name: "Person" },
      account: { provider: "nodemailer", providerAccountId: "x", type: "email" },
    } as Parameters<typeof signIn>[0]);

    expect(result).toBe(true);
    expect(ensureUserExists).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-2", email: "person@example.com" })
    );
  });

  it("still allows the sign-in when the sync itself throws", async () => {
    ensureUserExists.mockImplementationOnce(() => Promise.reject(new Error("db down")));
    const signIn = await loadSignIn();

    const result = await signIn({
      user: { id: "user-3", email: "person@example.com", name: "Person" },
      account: { provider: "nodemailer", providerAccountId: "x", type: "email" },
    } as Parameters<typeof signIn>[0]);

    expect(result).toBe(true);
  });
});
