import { adminConfig } from "@/config/admin-config";

interface MailtoOptions {
	to?: string | string[];
	subject?: string;
	body?: string;
	cc?: string | string[];
	bcc?: string | string[];
}

/**
 * Generate a mailto link with proper URL encoding
 * @param options - Email options for the mailto link
 * @returns Formatted mailto URL
 */
export function generateMailtoLink(options: MailtoOptions): string {
	const params = new URLSearchParams();

	// Handle recipients (to)
	if (options.to) {
		const recipients = Array.isArray(options.to) ? options.to.join(",") : options.to;
		params.set("to", recipients);
	}

	// Handle subject
	if (options.subject) {
		params.set("subject", options.subject);
	}

	// Handle body
	if (options.body) {
		params.set("body", options.body);
	}

	// Handle CC
	if (options.cc) {
		const ccRecipients = Array.isArray(options.cc) ? options.cc.join(",") : options.cc;
		params.set("cc", ccRecipients);
	}

	// Handle BCC
	if (options.bcc) {
		const bccRecipients = Array.isArray(options.bcc) ? options.bcc.join(",") : options.bcc;
		params.set("bcc", bccRecipients);
	}

	// Build the mailto URL
	const baseMailto = "mailto:";
	const queryString = params.toString();

	return queryString ? `${baseMailto}?${queryString}` : baseMailto;
}

/**
 * Generate a feedback mailto link using admin emails
 * @param content - The feedback content
 * @param source - Source of the feedback (dialog, popover, etc.)
 * @returns Formatted mailto URL for feedback
 */
export function generateFeedbackMailto(content: string, source: string): string {
	const adminEmails = adminConfig.emails;
	const subject = `Feedback from ${source} - Shipkit`;

	return generateMailtoLink({
		to: adminEmails[0], // Use first admin email as primary recipient
		cc: adminEmails.length > 1 ? adminEmails.slice(1) : undefined,
		subject,
		body: content,
	});
}

/**
 * Check if email service is available (Resend configured)
 * This function is for server-side use only
 * @returns Boolean indicating if email service is available
 */
export function isEmailServiceAvailable(): boolean {
	if (typeof window !== "undefined") {
		// Client-side: we can't access server env vars
		return false;
	}
	return !!(process.env.RESEND_API_KEY || process.env.RESEND_API_KEY);
}
