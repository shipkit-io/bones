import { env } from "@/env";

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
  /*
   * No defaults. These previously fell back to the template author's address
   * and domain, which meant every downstream deployment granted admin to
   * anyone holding a lacymorrow.com email. Deployments opt in via ADMIN_EMAIL
   * and ADMIN_DOMAINS.
   */
  emails: env.ADMIN_EMAIL
    ? env.ADMIN_EMAIL.split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    : [],

  domains: env.ADMIN_DOMAINS
    ? env.ADMIN_DOMAINS.split(",")
        .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
        .filter(Boolean)
    : [],

  // Check if an email is an admin based on config
  isAdminByEmailConfig: (email?: string | null): boolean => {
    if (!email) return false;

    const normalised = email.trim().toLowerCase();
    if (!normalised.includes("@")) return false;
    const domain = normalised.slice(normalised.lastIndexOf("@") + 1);

    return (
      adminConfig.emails.includes(normalised) ||
      // Compare the domain exactly. `endsWith("@evil-lacymorrow.com")` style
      // suffix matching would have accepted a lookalike domain.
      adminConfig.domains.includes(domain)
    );
  },
};
