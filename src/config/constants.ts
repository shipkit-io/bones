import { env } from "@/env";
import { siteConfig } from "./site-config";

export const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL ?? siteConfig.email.support;
