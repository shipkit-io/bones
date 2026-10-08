"use server";

import { siteConfig } from "@/config/site-config";
import { resend } from "@/lib/resend";
import { addContactToAudience } from "@/server/actions/subscribe";
import { contactFormSchema } from "@/types/contact";

// Reserved sentinel domains (RFC 2606 / RFC 6761). A submission from any
// address at these domains is a test: route to an inbox we control instead
// of the real recipient, prefix the subject with [TEST], and skip side
// effects (newsletter audience). Lets us exercise the full form pipeline
// end-to-end without delivering to the site owner.
const TEST_SENDER_DOMAINS = new Set(["test.com", "example.com"]);
const DEFAULT_TEST_RECIPIENT = "admin@buildandserve.com";

interface Recipient {
  to: string;
  isTest: boolean;
}

const resolveRecipient = (email: string | null | undefined, fallbackTo: string): Recipient => {
  const normalized = (email ?? "").trim().toLowerCase();
  const atIdx = normalized.lastIndexOf("@");
  const domain = atIdx >= 0 ? normalized.slice(atIdx + 1) : "";
  if (TEST_SENDER_DOMAINS.has(domain)) {
    const to =
      process.env.CONTACT_TEST_RECIPIENT ||
      process.env.ADMIN_EMAIL ||
      DEFAULT_TEST_RECIPIENT;
    return { to, isTest: true };
  }
  return { to: fallbackTo, isTest: false };
};

export async function submitContactForm(formData: FormData) {
  try {
    // Get form data
    const data = {
      name: formData.get("name"),
      contactInfo: formData.get("contactInfo"),
      message: formData.get("message"),
      newsletter: formData.get("newsletter") === "true",
    };

    // Validate form data
    const validatedData = contactFormSchema.parse(data);

    if (!resend) {
      console.warn("Resend client not initialized - RESEND_API_KEY not set");
      return { success: false, error: "Email service not configured" };
    }

    const { to, isTest } = resolveRecipient(validatedData.contactInfo, siteConfig.email.support);
    if (isTest) {
      console.log(`[submitContactForm] Test submission detected, routing to ${to}`);
    }

    // Send email
    const result = await resend.emails.send({
      from: `Contact Form <${siteConfig.email.noreply}>`,
      to: [to],
      subject: `${isTest ? "[TEST] " : ""}New Contact Form Submission`,
      replyTo: validatedData.contactInfo,
      html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>From:</strong> ${validatedData.name}</p>
                ${validatedData.contactInfo ? `<p><strong>Contact:</strong> ${validatedData.contactInfo}</p>` : ""}
                <p><strong>Message:</strong></p>
                <p>${validatedData.message.replace(/\n/g, "<br>")}</p>
                <p><strong>Newsletter:</strong> ${validatedData.newsletter ? "Yes" : "No"}</p>
            `,
    });

    // Handle newsletter subscription if requested. Skip for test senders:
    // their addresses are reserved domains that should never receive mail
    // and should not pollute the live audience.
    if (!isTest && validatedData.newsletter && validatedData.contactInfo?.includes("@")) {
      try {
        await addContactToAudience(validatedData.contactInfo);
      } catch (error) {
        console.error("Error subscribing to newsletter:", error);
        // Don't fail the whole request if newsletter subscription fails
      }
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    };
  }
}
