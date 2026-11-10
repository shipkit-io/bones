"use server";

import { siteConfig } from "@/config/site-config";
import { resend } from "@/lib/resend";
import { addContactToAudience } from "@/server/actions/subscribe";
import { resolveContactRecipient } from "@/server/services/contact-test-routing";
import { contactFormSchema } from "@/types/contact";

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

    const { to, isTest } = resolveContactRecipient(
      validatedData.contactInfo,
      siteConfig.email.support
    );
    if (isTest) {
      console.log(`[submitContactForm] Test submission detected, routing to ${to}`);
    }

    // Send email
    const result = await resend.emails.send({
      from: `Contact Form <${siteConfig.email.noreply}>`,
      to: [to],
      subject: `${isTest ? "[TEST] " : ""}New Contact Form Submission`,
      // Never reply-to a reserved sentinel domain; it would bounce.
      replyTo: isTest ? to : validatedData.contactInfo,
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
