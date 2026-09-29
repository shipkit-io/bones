// Stub. Install the @shipkit/payload registry item to replace this file.

import { logger } from "@/lib/logger";

/**
 * Payload is not installed, so there is no real client type to import. Hub
 * services (admin-service, auth-service, vercel) call many Local API methods
 * behind the NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED flag and null-check the
 * client; typing the stub as `any` keeps those shared ShipKit files compiling
 * until the @shipkit/payload item replaces this file with the real client.
 */
// biome-ignore lint/suspicious/noExplicitAny: stub until @shipkit/payload replaces this file
export type PayloadClient = any;

/**
 * Payload is not installed. Hub services call this behind the
 * NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED flag and handle a null client.
 */
export const getPayloadClient = async (): Promise<PayloadClient | null> => {
  logger.debug("Payload is not installed; add @shipkit/payload");
  return null;
};

export const payload: PayloadClient | null = null;
