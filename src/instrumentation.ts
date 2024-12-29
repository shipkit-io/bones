import { registerOTel } from "@vercel/otel";
import { type Instrumentation } from "next";

/**
 * Registers OpenTelemetry for observability in the application.
 * This function is called once when a new Next.js server instance is initiated.
 */
export function register() {
  registerOTel({
    serviceName: "shipkit",
    // Add any additional configuration options here
  });
}

/**
 * Handles server errors and reports them to a custom observability provider.
 * This function is triggered when the Next.js server captures an error.
 *
 * @param error - The caught error with a unique digest ID.
 * @param request - Information about the request that caused the error.
 * @param context - The context in which the error occurred.
 */
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  console.log("error", error);
  console.log("request", request);
  console.log("context", context);
  // await fetch("https://your-observability-endpoint/report-error", {
  //   method: "POST",
  //   body: JSON.stringify({
  //     message: error.message,
  //     request,
  //     context,
  //   }),
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  // });
};
