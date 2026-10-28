/**
 * Test-submission routing for contact forms.
 *
 * Reserved domains (RFC 2606 / RFC 6761) are never deliverable, so a
 * submission from an address at one of them is a test, not a real lead.
 * Those go to an inbox we control instead of the site owner, which lets us
 * exercise the whole form pipeline on a live site without spamming the
 * client.
 */

/** Sender domains treated as test sentinels. */
export const TEST_SENDER_DOMAINS = new Set(["test.com", "example.com"]);

/** Used when neither CONTACT_TEST_RECIPIENT nor ADMIN_EMAIL is set. */
export const DEFAULT_TEST_RECIPIENT = "admin@buildandserve.com";

export interface ContactRecipient {
  /** Address the submission should be delivered to. */
  to: string;
  /** True when the sender was a test sentinel. */
  isTest: boolean;
}

/** Domain of an address, lowercased. Empty string when there is no `@`. */
const domainOf = (value: string | null | undefined): string => {
  const normalized = (value ?? "").trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  return at >= 0 ? normalized.slice(at + 1) : "";
};

/**
 * Decide where a contact submission goes.
 *
 * `email` is the sender's contact info, which may be a phone number or
 * anything else the form accepts; only addresses at a sentinel domain are
 * rerouted.
 */
export const resolveContactRecipient = (
  email: string | null | undefined,
  fallbackTo: string
): ContactRecipient => {
  if (!TEST_SENDER_DOMAINS.has(domainOf(email))) {
    return { to: fallbackTo, isTest: false };
  }

  return {
    to:
      process.env.CONTACT_TEST_RECIPIENT ||
      process.env.ADMIN_EMAIL ||
      DEFAULT_TEST_RECIPIENT,
    isTest: true,
  };
};
