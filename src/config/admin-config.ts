/**
 * Admin Configuration
 *
 * Server-side only configuration for admin access control.
 * This file should only be imported by server components or server actions.
 */

/**
 * Admin configuration interface
 */
export interface AdminConfig {
	emails: string[];
	domains: string[];
	isAdminByEmailConfig: (email?: string | null) => boolean;
}

/**
 * Admin configuration with environment variable support
 * Allows setting admin emails via environment variables
 * during deployment without touching code
 */
export const adminConfig: AdminConfig = {
	// Admin emails - comma-separated list from environment variable or defaults
	emails: process.env.ADMIN_EMAIL
		? process.env.ADMIN_EMAIL.split(",").map((email) => email.trim())
		: ["me@lacymorrow.com"],

	// Admin domains - using default values
	domains: process.env.ADMIN_DOMAINS
		? process.env.ADMIN_DOMAINS.split(",").map((domain) => domain.trim())
		: ["lacymorrow.com"],

	// Check if an email is an admin based on config
	isAdminByEmailConfig: (email?: string | null): boolean => {
		if (!email) return false;

		return (
			adminConfig.emails.includes(email) ||
			adminConfig.domains.some((domain) => email.endsWith(`@${domain}`))
		);
	},
};
