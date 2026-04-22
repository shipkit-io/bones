import { Resend } from "resend";
import { env } from "@/env";

/**
 * Initialize Resend with API key if available, otherwise return null
 * This allows the application to build even if RESEND_API_KEY is not set
 * Falls back to RESEND_API_KEY for backward compatibility
 */
export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
