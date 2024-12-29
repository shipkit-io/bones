"use server";

import { env } from "@/env";
import { resend } from "@/lib/resend";

/**
 * Adds a contact to the Resend audience.
 * @param email - The email of the contact to add.
 * @returns A promise that resolves when the contact is added.
 */
export const addContactToAudience = async (email: string) => {
  try {
    if (!env.RESEND_API_KEY || !env.RESEND_AUDIENCE_ID) {
      throw new Error("Missing Resend API key or audience ID");
    }

    const result = await resend.contacts.create({
      email,
      audienceId: env.RESEND_AUDIENCE_ID,
    });
    console.log("result", result);
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error adding contact:", error.message);
      return { success: false, error: error.message };
    } else {
      console.error("Error adding contact:", error);
      return { success: false, error: "An unknown error occurred" };
    }
  }
};
