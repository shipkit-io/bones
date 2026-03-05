import { siteConfig } from "./site-config";

export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? siteConfig.email.support;
