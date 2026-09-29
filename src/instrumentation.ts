/**
 * Next.js instrumentation file
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 * WARNING: This needs to load on Node.js AND Edge runtime.
 */

import { registerOTel } from "@vercel/otel";
import type { Instrumentation } from "next";
import { isEvlogEnabled } from "@/lib/evlog";
import { displayLaunchMessage } from "@/lib/utils/kit-launch-message";

/**
 * evlog trial (LAC-3361). defineNodeInstrumentation loads evlog via dynamic
 * import on the Node.js runtime only, so Edge bundles stay clean; the loader
 * below only ever runs when register()/onRequestError fire with the flag on.
 * The drain reuses the existing OTel pipeline (OTEL_EXPORTER_OTLP_ENDPOINT).
 * without an endpoint, events still log locally.
 */
/**
 * evlog trial (LAC-3361). evlog reads node:fs and node:module, which webpack
 * cannot resolve. A static import here breaks `next dev --webpack` for every
 * route, flag on or off, because Next compiles this file through webpack. The
 * ignore comments keep both bundlers out of it so the import happens at runtime
 * on Node only; "evlog" is also in serverExternalPackages so tracing keeps it.
 * The drain reuses the existing OTel pipeline (OTEL_EXPORTER_OTLP_ENDPOINT).
 * without an endpoint, events still log locally.
 */
interface EvlogInstrumentation {
  register: () => Promise<void>;
  onRequestError: NonNullable<Instrumentation.onRequestError>;
}

let evlogPromise: Promise<EvlogInstrumentation> | null = null;

const loadEvlog = (): Promise<EvlogInstrumentation> => {
  evlogPromise ??= (async () => {
    const [{ defineNodeInstrumentation }, { createInstrumentation }, { createOTLPDrain }] =
      await Promise.all([
        import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "evlog/next/instrumentation"),
        import(
          /* webpackIgnore: true */ /* turbopackIgnore: true */ "evlog/next/instrumentation/create"
        ),
        import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "evlog/otlp"),
      ]);
    // Promise.resolve rather than an async arrow: the callback has to return a
    // promise, but there is nothing here to await and require-await rejects the
    // async form.
    return defineNodeInstrumentation(() =>
      Promise.resolve(
        createInstrumentation({
          service: "shipkit",
          drain: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? createOTLPDrain() : undefined,
        })
      )
    ) as EvlogInstrumentation;
  })();
  return evlogPromise;
};

/**
 * Registers OpenTelemetry for observability in the application.
 * This function is called once when a new Next.js server instance is initiated.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize payment providers once on server startup
    // await import("./instrumentation-node");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // await import('./instrumentation-edge')
  }

  displayLaunchMessage();
  registerOTel({
    serviceName: "shipkit",
    // Add any additional configuration options here
  });

  if (isEvlogEnabled()) {
    const evlog = await loadEvlog();
    await evlog.register();
  }
}

/**
 * Handles server errors and reports them to a custom observability provider.
 * This function is triggered when the Next.js server captures an error.
 *
 * @param error - The caught error with a unique digest ID.
 * @param request - Information about the request that caused the error.
 * @param context - The context in which the error occurred.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (!isEvlogEnabled()) return;
  const evlog = await loadEvlog();
  await evlog.onRequestError(error, request, context);
};
