import { siteConfig } from "./site-config";

/**
 * The relative path from the project root to the directory containing Next.js configuration plugins.
 */
export const NEXTJS_PLUGINS_DIR_RELATIVE = 'src/config/nextjs';

/**
 * Default "from" email for Resend. Falls back to support email.
 */
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? siteConfig.email.support;
