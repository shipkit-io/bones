// Stub. Install the @shipkit/payload registry item to replace this file.

import { logger } from "@/lib/logger";

/**
 * The slice of Payload's Local API that hub services (admin-service) touch.
 * Typing the stub structurally lets the shared ShipKit files compile before
 * the item is installed; the item replaces this file with the real client.
 */
export interface PayloadClient {
  find(args: {
    collection: string;
    where?: Record<string, unknown>;
    limit?: number;
    depth?: number;
  }): Promise<{ docs: Array<Record<string, unknown>>; totalDocs: number }>;
}

/**
 * Payload is not installed. Hub services call this behind the
 * NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED flag and handle a null client.
 */
export const getPayloadClient = async (): Promise<PayloadClient | null> => {
  logger.debug("Payload is not installed; add @shipkit/payload");
  return null;
};

export const payload: PayloadClient | null = null;
