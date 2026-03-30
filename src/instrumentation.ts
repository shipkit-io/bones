/**
 * Next.js instrumentation file
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 * WARNING: This needs to load on Node.js AND Edge runtime.
 */

import type { Instrumentation } from "next";
import { displayLaunchMessage } from "@/lib/utils/kit-launch-message";

/**
 * Registers instrumentation for the application.
 * This function is called once when a new Next.js server instance is initiated.
 */
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize payment providers once on server startup
    // await import("./instrumentation-node");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // await import('./instrumentation-edge')
  }

  displayLaunchMessage();

  // OpenTelemetry: install @vercel/otel and uncomment to enable
  // import { registerOTel } from "@vercel/otel";
  // registerOTel({ serviceName: "bones" });
}

/**
 * Handles server errors and reports them to a custom observability provider.
 * This function is triggered when the Next.js server captures an error.
 */
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  console.debug("error", error);
  console.debug("request", request);
  console.debug("context", context);
};
