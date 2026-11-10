import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_TEST_RECIPIENT,
  resolveContactRecipient,
} from "@/server/services/contact-test-routing";

const SUPPORT = "support@client.example-site.org";

describe("resolveContactRecipient", () => {
  const saved = {
    recipient: process.env.CONTACT_TEST_RECIPIENT,
    admin: process.env.ADMIN_EMAIL,
  };

  beforeEach(() => {
    delete process.env.CONTACT_TEST_RECIPIENT;
    delete process.env.ADMIN_EMAIL;
  });

  afterEach(() => {
    if (saved.recipient === undefined) delete process.env.CONTACT_TEST_RECIPIENT;
    else process.env.CONTACT_TEST_RECIPIENT = saved.recipient;
    if (saved.admin === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = saved.admin;
  });

  it("sends a real submission to the site recipient", () => {
    expect(resolveContactRecipient("someone@gmail.com", SUPPORT)).toEqual({
      to: SUPPORT,
      isTest: false,
    });
  });

  it("reroutes senders at reserved sentinel domains", () => {
    for (const sender of ["test@test.com", "anything@example.com"]) {
      expect(resolveContactRecipient(sender, SUPPORT)).toEqual({
        to: DEFAULT_TEST_RECIPIENT,
        isTest: true,
      });
    }
  });

  it("ignores case and surrounding whitespace", () => {
    expect(resolveContactRecipient("  TEST@Test.COM  ", SUPPORT).isTest).toBe(true);
  });

  it("prefers CONTACT_TEST_RECIPIENT, then ADMIN_EMAIL", () => {
    process.env.ADMIN_EMAIL = "admin@site.test";
    expect(resolveContactRecipient("test@test.com", SUPPORT).to).toBe("admin@site.test");

    process.env.CONTACT_TEST_RECIPIENT = "forms@site.test";
    expect(resolveContactRecipient("test@test.com", SUPPORT).to).toBe("forms@site.test");
  });

  it("does not reroute lookalike domains or subdomains", () => {
    for (const sender of [
      "a@test.com.evil.com",
      "a@nottest.com",
      "a@mail.example.com",
      "a@example.org",
    ]) {
      expect(resolveContactRecipient(sender, SUPPORT)).toEqual({ to: SUPPORT, isTest: false });
    }
  });

  it("leaves non-email contact info alone", () => {
    for (const value of ["+1 555 0100", "", null, undefined]) {
      expect(resolveContactRecipient(value, SUPPORT)).toEqual({ to: SUPPORT, isTest: false });
    }
  });
});

describe("resolveContactRecipient env fallbacks", () => {
  const saved = {
    recipient: process.env.CONTACT_TEST_RECIPIENT,
    admin: process.env.ADMIN_EMAIL,
  };

  afterEach(() => {
    if (saved.recipient === undefined) delete process.env.CONTACT_TEST_RECIPIENT;
    else process.env.CONTACT_TEST_RECIPIENT = saved.recipient;
    if (saved.admin === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = saved.admin;
  });

  it("falls through a blank env var instead of mailing nobody", () => {
    process.env.CONTACT_TEST_RECIPIENT = "   ";
    process.env.ADMIN_EMAIL = "admin@site.test";
    expect(resolveContactRecipient("test@test.com", SUPPORT).to).toBe("admin@site.test");

    process.env.ADMIN_EMAIL = "";
    expect(resolveContactRecipient("test@test.com", SUPPORT).to).toBe(DEFAULT_TEST_RECIPIENT);
  });
});
