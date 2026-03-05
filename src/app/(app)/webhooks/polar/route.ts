import type { NextRequest } from "next/server";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { processPolarWebhook } from "@/lib/polar";

/**
 * Polar webhook handler
 * Processes webhooks from Polar and updates payments with proper product names
 */
export async function POST(request: NextRequest) {
	// Check if Polar is enabled
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		logger.debug("Polar feature is disabled. Webhook ignored.");
		return new Response("Polar feature disabled", { status: 200 });
	}

	logger.debug("Polar webhook received");

	try {
		// Get the raw body for webhook verification
		const body = await request.text();
		let event;

		try {
			event = JSON.parse(body);
		} catch (error) {
			logger.error("Failed to parse Polar webhook body", { error });
			return new Response("Invalid JSON", { status: 400 });
		}

		logger.debug("Parsed Polar webhook event", {
			eventType: event?.type,
			eventId: event?.id,
			orderId: event?.data?.id,
		});

		// Verify webhook signature if configured
		// Note: Polar webhook verification implementation would go here
		// For now, we'll process the webhook directly

		// Extract enhanced product information for webhook processing
		if (event?.data) {
			// Apply the same product name extraction logic
			const webhookData = event.data;
			let productName = "Unknown Product";
			let extractionSource = "fallback";

			// Enhanced product name extraction for webhook events
			if (webhookData.product?.name) {
				productName = webhookData.product.name;
				extractionSource = "webhookData.product.name";
			} else if (webhookData.variant?.name) {
				productName = webhookData.variant.name;
				extractionSource = "webhookData.variant.name";
			} else if (webhookData.productName) {
				productName = webhookData.productName;
				extractionSource = "webhookData.productName";
			} else if (webhookData.description) {
				productName = webhookData.description;
				extractionSource = "webhookData.description";
			} else if (
				webhookData.items &&
				Array.isArray(webhookData.items) &&
				webhookData.items.length > 0
			) {
				const firstItem = webhookData.items[0];
				if (firstItem.product?.name) {
					productName = firstItem.product.name;
					extractionSource = "webhookData.items[0].product.name";
				} else if (firstItem.variant?.name) {
					productName = firstItem.variant.name;
					extractionSource = "webhookData.items[0].variant.name";
				} else if (firstItem.name) {
					productName = firstItem.name;
					extractionSource = "webhookData.items[0].name";
				}
			}

			// Log product name extraction for debugging
			logger.debug("Webhook product name extraction", {
				eventType: event.type,
				orderId: webhookData.id,
				productName,
				extractionSource,
				availableFields: {
					hasProduct: !!webhookData.product,
					productName: webhookData.product?.name,
					hasVariant: !!webhookData.variant,
					variantName: webhookData.variant?.name,
					webhookProductName: webhookData.productName,
					description: webhookData.description,
					hasItems: !!(
						webhookData.items &&
						Array.isArray(webhookData.items) &&
						webhookData.items.length > 0
					),
				},
			});

			// Enhance the webhook data with extracted product name
			event.data = {
				...webhookData,
				productName: productName,
				_productNameExtractionSource: extractionSource,
			};
		}

		// Process the webhook using the lib function
		await processPolarWebhook(event);

		logger.debug("Polar webhook processed successfully", {
			eventType: event?.type,
			eventId: event?.id,
		});

		return new Response("Webhook processed", { status: 200 });
	} catch (error: unknown) {
		if (error instanceof Error) {
			logger.error("Error processing Polar webhook", {
				error: error.message,
				stack: error.stack,
			});

			// Return 200 to prevent webhook retries for non-recoverable errors
			// Return 500 for recoverable errors that should be retried
			if (error.message?.includes("rate limit") || error.message?.includes("timeout")) {
				return new Response("Temporary error", { status: 500 });
			}

			return new Response("Webhook processing failed", { status: 200 });
		}

		logger.error("Error processing Polar webhook", {
			error: error,
		});

		return new Response("Webhook processing failed", { status: 200 });
	}
}

/**
 * GET handler for webhook endpoint verification
 */
export async function GET() {
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		return new Response("Polar feature disabled", { status: 404 });
	}

	return new Response("Polar webhook endpoint", { status: 200 });
}
