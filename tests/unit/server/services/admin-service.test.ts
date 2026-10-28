/**
 * Regression tests for the Payload hole in `isAdmin()` (LAC-5048, ported LAC-5245).
 *
 * `isAdmin()` used to end with "this email exists in Payload's `users`
 * collection, therefore admin". `auth-service` writes every
 * credentials-registered account into that same collection, so on any
 * deployment with Payload enabled every registered user was an admin.
 *
 * These are unit tests rather than additions to the integration suite on
 * purpose: `tests/integration/server/services/admin-service.test.ts` mocks
 * `getPayloadClient` to return `null`, which is exactly why it never caught
 * this. The Payload branch needs a client that answers.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dbFindFirst: vi.fn(),
  getPayloadClient: vi.fn(),
  payloadFind: vi.fn(),
  hasPermission: vi.fn(),
  isAdminByEmailConfig: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: { query: { users: { findFirst: mocks.dbFindFirst } } },
}));

vi.mock("@/lib/payload/payload", () => ({
  getPayloadClient: mocks.getPayloadClient,
  payload: null,
}));

vi.mock("@/server/services/rbac", () => ({
  rbacService: { hasPermission: mocks.hasPermission },
}));

vi.mock("@/config/admin-config", () => ({
  adminConfig: {
    emails: [],
    domains: [],
    isAdminByEmailConfig: mocks.isAdminByEmailConfig,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { isAdmin } = await import("@/server/services/admin-service");

/** What Payload returns for an account that signed up through the normal flow. */
const payloadHit = {
  docs: [{ id: "payload-1", email: "registered@shipkit.test" }],
  totalDocs: 1,
};

describe("isAdmin and Payload membership (LAC-5048, ported LAC-5245)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAdminByEmailConfig.mockReturnValue(false);
    mocks.hasPermission.mockResolvedValue(false);
    mocks.payloadFind.mockResolvedValue(payloadHit);
    mocks.getPayloadClient.mockResolvedValue({ find: mocks.payloadFind });
  });

  it("refuses a Payload-synced user who is not an admin anywhere else", async () => {
    // Ordinary account: role "user", email verified, no RBAC grant, no config
    // match. Its only distinguishing feature is a row in Payload's `users`
    // collection, which credentials registration creates for everybody.
    mocks.dbFindFirst.mockResolvedValue({
      id: "user-1",
      role: "user",
      emailVerified: new Date(),
    });

    expect(await isAdmin({ email: "registered@shipkit.test" })).toBe(false);
  });

  it("refuses a Payload-only user with no Shipkit account at all", async () => {
    mocks.dbFindFirst.mockResolvedValue(undefined);

    expect(await isAdmin({ email: "payload-only@shipkit.test" })).toBe(false);
  });

  it("never consults Payload while deciding admin status", async () => {
    // The stronger claim, and the one that keeps the hole from being
    // reintroduced in a different shape: Payload is not an input to this
    // decision. Nothing in that collection distinguishes an admin from a
    // signup, so there is no query here worth making.
    mocks.dbFindFirst.mockResolvedValue({
      id: "user-1",
      role: "user",
      emailVerified: new Date(),
    });

    await isAdmin({ email: "registered@shipkit.test" });

    expect(mocks.getPayloadClient).not.toHaveBeenCalled();
    expect(mocks.payloadFind).not.toHaveBeenCalled();
  });

  it("still grants a Payload-synced user who holds role=admin", async () => {
    // Removing the Payload check must not cost a real admin their access.
    mocks.dbFindFirst.mockResolvedValue({
      id: "admin-1",
      role: "admin",
      emailVerified: new Date(),
    });

    expect(await isAdmin({ email: "registered@shipkit.test" })).toBe(true);
  });

  it("still grants a Payload-synced user who holds the RBAC system:admin permission", async () => {
    mocks.dbFindFirst.mockResolvedValue({
      id: "rbac-1",
      role: "user",
      emailVerified: new Date(),
    });
    mocks.hasPermission.mockResolvedValue(true);

    expect(await isAdmin({ email: "registered@shipkit.test" })).toBe(true);
    expect(mocks.hasPermission).toHaveBeenCalledWith("rbac-1", "system", "admin");
  });

  it("still grants a verified account that the static config names", async () => {
    mocks.isAdminByEmailConfig.mockReturnValue(true);
    mocks.dbFindFirst.mockResolvedValue({
      id: "config-1",
      role: "user",
      emailVerified: new Date(),
    });

    expect(await isAdmin({ email: "registered@shipkit.test" })).toBe(true);
  });
});
