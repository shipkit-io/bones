// Todo: if payload is accessed when there is no database setup, the whole app crashes.

import payloadConfig from "@payload-config";
import { getPayload } from "payload";
import { env } from "@/env";
import { logger } from "@/lib/logger";

// Flag to track if the warning has been logged
const payloadWarningLogged = false;

// Initialize Payload
export const getPayloadClient = async () => {
	if (!env?.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED) {
		// logger.debug("Payload not initialized: DATABASE_URL is missing or Payload is not enabled");
		return null;
	}

	try {
		// Initialize Payload
		const payload = await getPayload({
			// Pass in the config
			config: payloadConfig,
		});

		return payload;
	} catch (error) {
		console.warn("Payload failed to initialize", error);
		return null;
	}
};

// Export a singleton instance
export const payload = await getPayloadClient();
