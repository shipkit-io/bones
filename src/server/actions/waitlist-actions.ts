"use server";

import { env } from "@/env";
import { resend } from "@/lib/resend";
import {
	addWaitlistEntry,
	isEmailOnWaitlist,
} from "@/server/services/waitlist-service";

export interface WaitlistFormData {
	email: string;
	name: string;
	company?: string;
	role?: string;
	projectType?: string;
	timeline?: string;
	interests?: string;
}

/**
 * Adds a user to the waitlist with additional metadata.
 * @param formData - The waitlist form data
 * @returns A promise that resolves with success status
 */
export const addToWaitlist = async (formData: WaitlistFormData) => {
	try {
		// Check if email is already on waitlist
		const isAlreadyOnWaitlist = await isEmailOnWaitlist(formData.email);
		if (isAlreadyOnWaitlist) {
			return { success: false, error: "Email is already on the waitlist" };
		}

		// Store in database first
		const entry = await addWaitlistEntry({
			email: formData.email,
			name: formData.name,
			company: formData.company || null,
			role: formData.role || null,
			projectType: formData.projectType || null,
			timeline: formData.timeline || null,
			interests: formData.interests || null,
			source: "website",
		});

		// If database is not available, entry will be null but we don't fail
		if (!entry) {
			console.warn("Database not available, waitlist entry not saved to database");
		}

		// Add to Resend audience if configured
		if (env.RESEND_AUDIENCE_ID && resend) {
			try {
				await resend.contacts.create({
					email: formData.email,
					firstName: formData.name.split(" ")[0],
					lastName: formData.name.split(" ").slice(1).join(" ") || undefined,
					audienceId: env.RESEND_AUDIENCE_ID,
					unsubscribed: false,
				});
			} catch (resendError) {
				console.warn("Failed to add to Resend audience:", resendError);
				// Continue even if Resend fails - we have the data in our database
			}
		}

		// Send welcome email if configured
		if ((env.RESEND_API_KEY || env.RESEND_API_KEY) && resend) {
			try {
				await resend.emails.send({
					from: env.RESEND_FROM_EMAIL || "Shipkit <noreply@shipkit.io>",
					to: formData.email,
					subject: "Welcome to the Shipkit Waitlist! 🚀",
					html: `
						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
							<h1 style="color: #2563eb;">Welcome to Shipkit, ${formData.name.split(" ")[0]}!</h1>
							<p>Thanks for joining our waitlist. You're now part of an exclusive group of developers who will get early access to Shipkit.</p>

							<h2>What's Next?</h2>
							<ul>
								<li>🎯 <strong>Early Access:</strong> You'll be among the first to try Shipkit</li>
								<li>💰 <strong>50% Launch Discount:</strong> Exclusive pricing locked in forever</li>
								<li>🚀 <strong>Bonus Content:</strong> Tutorials and deployment guides</li>
							</ul>

							<p>We'll keep you updated on our progress and notify you as soon as early access is available.</p>

							<p>In the meantime, follow us on <a href="https://twitter.com/lacybuilds">Twitter</a> for the latest updates!</p>

							<p>Best regards,<br>The Shipkit Team</p>

							<hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
							<p style="font-size: 12px; color: #6b7280;">
								You're receiving this email because you joined the Shipkit waitlist.
								<a href="{{unsubscribe_url}}">Unsubscribe</a>
							</p>
						</div>
					`,
				});
			} catch (emailError) {
				console.warn("Failed to send welcome email:", emailError);
				// Continue even if email fails - user is still on waitlist
			}
		}

		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error("Error adding to waitlist:", error.message);
			return { success: false, error: error.message };
		}
		console.error("Error adding to waitlist:", error);
		return { success: false, error: "An unknown error occurred" };
	}
};

/**
 * Simple email-only waitlist signup (for the hero form)
 * @param email - The email address
 * @returns A promise that resolves with success status
 */
export const addToWaitlistSimple = async (email: string) => {
	const emailParts = email.split("@");
	const name = emailParts.length > 0 ? emailParts[0]! : email;
	return addToWaitlist({
		email,
		name, // Use email prefix as fallback name
	});
};

