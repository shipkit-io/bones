import { BASE_URL } from "@/config/base-url";

/**
 * Validate that a URL is properly formatted
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if we're running in production
 */
export const isProduction = process.env.NODE_ENV === "production";

/**
 * Check if we're running on Vercel
 */
export const isVercel = Boolean(process.env.VERCEL);

/**
 * Get the current environment
 */
export const environment = process.env.NODE_ENV || "development";

/**
 * Check if we're running at bones.sh
 */
export const isBonesApp = BASE_URL.toLowerCase().includes("bones.sh");