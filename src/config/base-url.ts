/**
 * Base URL configuration utility
 * Provides a reliable way to get the application's base URL across different environments
 */

// THIS IMPORT MUST BE RELATIVE, next.config loads this file before TS aliases are available.
import { siteConfig } from "./site-config";

const port = process.env.PORT ?? 3000;
const host = process.env.HOST ?? "localhost";

/**
 * Get the base URL for the application
 * Priority order:
 * 1. Explicit URL environment variables
 * 2. Vercel URLs (if available)
 * 3. Client-side window.location.origin
 * 4. Development fallback
 */
function getBaseUrl(): string {
  // If we're in the browser, use the current origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // In production, try various environment variables in order of preference
  if (process.env.NODE_ENV === "production") {
    // Explicit URL configurations (most reliable)
    if (process.env.URL) {
      return process.env.URL;
    }

    if (process.env.AUTH_URL) {
      return process.env.AUTH_URL;
    }

    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }

    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }

    // Vercel URLs (construct only if they exist)
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }

    if (siteConfig.url) {
      return siteConfig.url;
    }

    // Fall back to vercel url
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }

    // Fallback for production (should not reach here in most cases)
    console.warn("No production URL found, falling back to localhost");
    return `http://${host}:${port}`;
  }

  // Development fallback
  return `http://${host}:${port}`;
}

export const BASE_URL = getBaseUrl();
