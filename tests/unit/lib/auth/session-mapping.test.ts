// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mapClerkSession } from "@/lib/auth/session-mapping";

/**
 * `mapClerkSession` turns a Clerk user (the server's `User` or the client's
 * `UserResource`, structurally) into the Auth.js `Session` every component and
 * service reads. Both sides must produce the same result for the same person.
 */

const serverUser = {
  id: "user_1",
  primaryEmailAddress: { emailAddress: "ada@example.test", verification: { status: "verified" } },
  fullName: "Ada Lovelace",
  firstName: "Ada",
  lastName: "Lovelace",
  imageUrl: "https://img.clerk.com/ada",
  publicMetadata: { role: "admin" },
  createdAt: Date.UTC(2026, 0, 2, 3, 4, 5),
  updatedAt: Date.UTC(2026, 4, 6, 7, 8, 9),
};

const clientUser = {
  ...serverUser,
  createdAt: new Date(serverUser.createdAt),
  updatedAt: new Date(serverUser.updatedAt),
};

describe("mapClerkSession", () => {
  it("returns null when signed out", () => {
    expect(mapClerkSession(null, null)).toBeNull();
    expect(mapClerkSession(undefined, 0)).toBeNull();
  });

  it("produces the Auth.js session shape from the server user and exp claim", () => {
    const exp = 1893456000; // seconds
    const session = mapClerkSession(serverUser, exp);
    expect(session).toEqual({
      expires: new Date(exp * 1000).toISOString(),
      user: expect.objectContaining({
        id: "user_1",
        email: "ada@example.test",
        name: "Ada Lovelace",
        image: "https://img.clerk.com/ada",
        role: "admin",
        isAdmin: true,
        createdAt: new Date(serverUser.createdAt),
        updatedAt: new Date(serverUser.updatedAt),
      }),
    });
    expect(session?.user.emailVerified).toBeInstanceOf(Date);
  });

  it("maps the client user with a Date expiry to the same person", () => {
    const expireAt = new Date("2030-01-02T03:04:05.000Z");
    const fromClient = mapClerkSession(clientUser, expireAt);
    const fromServer = mapClerkSession(serverUser, expireAt.getTime() / 1000);
    expect(fromClient).toEqual(fromServer);
    expect(fromClient?.expires).toBe("2030-01-02T03:04:05.000Z");
  });

  it("treats anything but publicMetadata.role=admin as a plain user", () => {
    for (const publicMetadata of [{}, { role: "owner" }, { role: 1 }, undefined]) {
      const session = mapClerkSession({ ...serverUser, publicMetadata }, null);
      expect(session?.user.role).toBe("user");
      expect(session?.user.isAdmin).toBe(false);
    }
  });

  it("falls back to first and last name, then to no name", () => {
    expect(mapClerkSession({ ...serverUser, fullName: null }, null)?.user.name).toBe(
      "Ada Lovelace"
    );
    expect(
      mapClerkSession({ ...serverUser, fullName: null, lastName: null }, null)?.user.name
    ).toBe("Ada");
    expect(
      mapClerkSession({ ...serverUser, fullName: null, firstName: null, lastName: null }, null)
        ?.user.name
    ).toBeNull();
  });

  it("reports an unverified or missing email without throwing", () => {
    const unverified = mapClerkSession(
      {
        ...serverUser,
        primaryEmailAddress: { emailAddress: "x@example.test", verification: { status: null } },
      },
      null
    );
    expect(unverified?.user.emailVerified).toBeNull();
    const none = mapClerkSession({ ...serverUser, primaryEmailAddress: null }, null);
    expect(none?.user).toMatchObject({ email: "", emailVerified: null });
  });

  it("uses the epoch when no expiry is known", () => {
    expect(mapClerkSession(serverUser, null)?.expires).toBe(new Date(0).toISOString());
  });
});
