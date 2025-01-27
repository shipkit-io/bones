/* Error Boundary Component for App Routes
 * This is a special Next.js error boundary for the (app) route group
 * Must be a Client Component to use error boundaries
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
"use client";

/* Re-export the default error boundary component
 * This provides consistent error handling across the app routes
 * The error boundary component handles:
 * - Displaying user-friendly error messages
 * - Providing retry functionality
 * - Logging errors appropriately
 */
export { default } from "@/components/primitives/error-boundary";
