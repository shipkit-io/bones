import crypto from "crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
// @see https://docs.lemonsqueezy.com/api/webhooks
// @see https://raw.githubusercontent.com/lmsqueezy/nextjs-billing/refs/heads/main/src/app/api/webhook/route.ts
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { payments, users } from "@/server/db/schema";
import { PaymentService } from "@/server/services/payment-service";
import { userService } from "@/server/services/user-service";

// Types for webhook payload structure
interface WebhookMeta {
	event_name: string;
	test_mode: boolean;
	custom_data?: Record<string, any>;
}

interface OrderAttributes {
	store_id: number;
	customer_id?: number;
	identifier: string;
	order_number: number;
	user_name: string | null;
	user_email: string | null;
	currency: string;
	subtotal: number;
	discount_total: number;
	tax: number;
	total: number;
	subtotal_usd: number;
	discount_total_usd: number;
	tax_usd: number;
	total_usd: number;
	status: "pending" | "paid" | "refunded" | "cancelled";
	refunded: boolean;
	refunded_at: string | null;
	first_order_item: {
		id: number;
		order_id: number;
		product_id: number;
		variant_id: number;
		product_name: string;
		variant_name: string;
		price: number;
		created_at: string;
		updated_at: string;
	};
	created_at: string;
	updated_at: string;
	test_mode: boolean;
}

interface SubscriptionAttributes {
	store_id: number;
	customer_id: number;
	order_id: number;
	order_item_id: number;
	product_id: number;
	variant_id: number;
	product_name: string;
	variant_name: string;
	user_name: string;
	user_email: string;
	status: "on_trial" | "active" | "paused" | "past_due" | "unpaid" | "cancelled" | "expired";
	status_formatted: string;
	card_brand: string | null;
	card_last_four: string | null;
	pause: any | null;
	cancelled: boolean;
	trial_ends_at: string | null;
	billing_anchor: number;
	urls: {
		update_payment_method: string;
		customer_portal: string;
		customer_portal_update_subscription: string;
	};
	renews_at: string;
	ends_at: string | null;
	created_at: string;
	updated_at: string;
	test_mode: boolean;
}

interface WebhookPayload {
	meta: WebhookMeta;
	data: {
		type: "orders" | "subscriptions" | "subscription_invoices" | "license_keys";
		id: string;
		attributes: OrderAttributes | SubscriptionAttributes | any;
	};
}

/**
 * Verify webhook signature using timing-safe comparison
 * @see https://docs.lemonsqueezy.com/guides/developer-guide/webhooks#signing-and-validating-webhook-requests
 */
function verifyWebhookSignature(rawBody: string, signature: string): boolean {
	if (!env.LEMONSQUEEZY_WEBHOOK_SECRET) {
		logger.error("LEMONSQUEEZY_WEBHOOK_SECRET environment variable is not set");
		return false;
	}

	try {
		const hmac = crypto.createHmac("sha256", env.LEMONSQUEEZY_WEBHOOK_SECRET);
		const digest = Buffer.from(hmac.update(rawBody, "utf8").digest("hex"), "hex");
		const signatureBuffer = Buffer.from(signature, "hex");

		if (digest.length !== signatureBuffer.length) {
			logger.warn("Webhook signature length mismatch", {
				expectedLength: digest.length,
				receivedLength: signatureBuffer.length,
			});
			return false;
		}

		const isValid = crypto.timingSafeEqual(digest, signatureBuffer);

		if (!isValid) {
			logger.warn("Invalid webhook signature", {
				expectedSignature: digest.toString("hex"),
				receivedSignature: signature,
			});
		}

		return isValid;
	} catch (error) {
		logger.error("Error verifying webhook signature", { error });
		return false;
	}
}

/**
 * Check if event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string, eventName: string): Promise<boolean> {
	try {
		// Check if we've already processed this exact event
		const existingPayment = await db?.query.payments.findFirst({
			where: eq(payments.orderId, eventId),
		});

		// For subscription events, also check by subscription ID in metadata
		if (!existingPayment && eventName.startsWith("subscription_")) {
			const existingSubscriptionPayment = await db?.query.payments.findFirst({
				where: (payments, { and, like }) =>
					like(payments.metadata, `%"subscription_id":"${eventId}"%`),
			});
			return !!existingSubscriptionPayment;
		}

		return !!existingPayment;
	} catch (error) {
		logger.error("Error checking if event is processed", { eventId, eventName, error });
		return false;
	}
}

/**
 * Find or create user from webhook data using consistent userService method
 */
async function findOrCreateUser(
	userEmail: string,
	userName?: string | null,
	customData?: any
): Promise<string> {
	try {
		// First try to find user by custom data user_id
		if (customData?.user_id) {
			const existingUser = await db?.query.users.findFirst({
				where: eq(users.id, customData.user_id),
			});
			if (existingUser) {
				return existingUser.id;
			}
		}

		// Use the consistent userService method for finding or creating users
		const { user, created } = await userService.findOrCreateUserByEmail(userEmail, {
			name: userName || null,
		});

		if (created) {
			logger.info("Created new user from webhook", {
				userId: user.id,
				email: userEmail,
				name: userName,
			});
		} else {
			logger.debug("Found existing user from webhook", {
				userId: user.id,
				email: userEmail,
			});
		}

		return user.id;
	} catch (error) {
		logger.error("Error finding or creating user", { userEmail, userName, error });
		throw new Error(`Failed to find or create user: ${error}`);
	}
}

/**
 * Handle order_created webhook event
 */
async function handleOrderCreated(payload: WebhookPayload): Promise<void> {
	const { data, meta } = payload;
	const attributes = data.attributes as OrderAttributes;

	logger.info("Processing order_created webhook", {
		orderId: data.id,
		userEmail: attributes.user_email,
		status: attributes.status,
		amount: attributes.total_usd,
		testMode: meta.test_mode,
	});

	// Only process paid orders
	if (attributes.status !== "paid") {
		logger.info("Skipping non-paid order", {
			orderId: data.id,
			status: attributes.status,
		});
		return;
	}

	if (!attributes.user_email) {
		throw new Error("Order missing user email");
	}

	// Find or create user
	const userId = await findOrCreateUser(
		attributes.user_email,
		attributes.user_name,
		meta.custom_data
	);

	// Create payment record using transaction
	await db?.transaction(async (tx) => {
		await tx.insert(payments).values({
			userId,
			orderId: data.id,
			amount: attributes.total_usd || attributes.total,
			status: "completed",
			processor: "lemonsqueezy",
			metadata: JSON.stringify({
				// Store product information at top level for easy access
				productName: attributes.first_order_item?.product_name || "Unknown Product",
				variantName: attributes.first_order_item?.variant_name || null,
				product_name: attributes.first_order_item?.product_name || "Unknown Product",
				variant_name: attributes.first_order_item?.variant_name || null,
				productId: attributes.first_order_item?.product_id || null,
				variantId: attributes.first_order_item?.variant_id || null,
				product_id: attributes.first_order_item?.product_id || null,
				variant_id: attributes.first_order_item?.variant_id || null,

				// Store order details
				order_identifier: attributes.identifier,
				order_number: attributes.order_number,
				customer_id: attributes.customer_id,
				currency: attributes.currency,
				test_mode: meta.test_mode,
				custom_data: meta.custom_data,
				webhook_event: "order_created",
			}),
		});
	});

	logger.info("Order processed successfully", {
		orderId: data.id,
		userId,
		amount: attributes.total_usd || attributes.total,
	});
}

/**
 * Handle order_refunded webhook event
 */
async function handleOrderRefunded(payload: WebhookPayload): Promise<void> {
	const { data } = payload;
	const attributes = data.attributes as OrderAttributes;

	logger.info("Processing order_refunded webhook", {
		orderId: data.id,
		refundedAt: attributes.refunded_at,
	});

	// Update payment status using transaction
	await db?.transaction(async (tx) => {
		const [updatedPayment] = await tx
			.update(payments)
			.set({
				status: "refunded",
				updatedAt: new Date(),
			})
			.where(eq(payments.orderId, data.id))
			.returning();

		if (!updatedPayment) {
			logger.warn("Payment not found for refund", { orderId: data.id });
			throw new Error(`Payment not found for order ${data.id}`);
		}
	});

	logger.info("Order refund processed successfully", {
		orderId: data.id,
	});
}

/**
 * Handle subscription_created webhook event
 */
async function handleSubscriptionCreated(payload: WebhookPayload): Promise<void> {
	const { data, meta } = payload;
	const attributes = data.attributes as SubscriptionAttributes;

	logger.info("Processing subscription_created webhook", {
		subscriptionId: data.id,
		userEmail: attributes.user_email,
		status: attributes.status,
		productName: attributes.product_name,
	});

	// Find or create user
	const userId = await findOrCreateUser(
		attributes.user_email,
		attributes.user_name,
		meta.custom_data
	);

	// Create subscription record using transaction
	await db?.transaction(async (tx) => {
		await tx.insert(payments).values({
			userId,
			orderId: data.id, // Use subscription ID as order ID for subscriptions
			amount: 0, // Subscriptions don't have an upfront amount
			status: attributes.status === "active" ? "completed" : "pending",
			processor: "lemonsqueezy",
			metadata: JSON.stringify({
				subscription_id: data.id,
				customer_id: attributes.customer_id,
				order_id: attributes.order_id,
				order_item_id: attributes.order_item_id,
				product_id: attributes.product_id,
				variant_id: attributes.variant_id,
				product_name: attributes.product_name,
				variant_name: attributes.variant_name,
				subscription_status: attributes.status,
				renews_at: attributes.renews_at,
				ends_at: attributes.ends_at,
				trial_ends_at: attributes.trial_ends_at,
				billing_anchor: attributes.billing_anchor,
				test_mode: meta.test_mode,
				custom_data: meta.custom_data,
				webhook_event: "subscription_created",
				urls: attributes.urls,
			}),
		});
	});

	logger.info("Subscription created successfully", {
		subscriptionId: data.id,
		userId,
		status: attributes.status,
	});
}

/**
 * Handle subscription status change events
 */
async function handleSubscriptionStatusChange(
	payload: WebhookPayload,
	eventName: string
): Promise<void> {
	const { data } = payload;
	const attributes = data.attributes as SubscriptionAttributes;

	logger.info(`Processing ${eventName} webhook`, {
		subscriptionId: data.id,
		status: attributes.status,
		cancelled: attributes.cancelled,
	});

	// Update subscription status using transaction
	await db?.transaction(async (tx) => {
		const existingPayment = await tx.query.payments.findFirst({
			where: (payments, { like }) => like(payments.metadata, `%"subscription_id":"${data.id}"%`),
		});

		if (!existingPayment) {
			logger.warn("Subscription payment not found", { subscriptionId: data.id });
			throw new Error(`Subscription payment not found for ${data.id}`);
		}

		const existingMetadata = JSON.parse(existingPayment.metadata || "{}");

		// Update the metadata with new subscription status
		const updatedMetadata = {
			...existingMetadata,
			subscription_status: attributes.status,
			cancelled: attributes.cancelled,
			renews_at: attributes.renews_at,
			ends_at: attributes.ends_at,
			webhook_event: eventName,
			last_updated: new Date().toISOString(),
		};

		await tx
			.update(payments)
			.set({
				metadata: updatedMetadata,
				status: getPaymentStatusFromSubscription(attributes.status, attributes.cancelled),
				updatedAt: new Date(),
			})
			.where(eq(payments.id, existingPayment.id));
	});

	logger.info(`Subscription ${eventName} processed successfully`, {
		subscriptionId: data.id,
		status: attributes.status,
	});
}

/**
 * Map subscription status to payment status
 */
function getPaymentStatusFromSubscription(subscriptionStatus: string, cancelled: boolean): string {
	if (cancelled) return "cancelled";

	switch (subscriptionStatus) {
		case "active":
		case "on_trial":
			return "completed";
		case "paused":
			return "pending";
		case "past_due":
		case "unpaid":
			return "failed";
		case "cancelled":
		case "expired":
			return "cancelled";
		default:
			return "pending";
	}
}

/**
 * Handle subscription payment events
 */
async function handleSubscriptionPayment(
	payload: WebhookPayload,
	eventName: string
): Promise<void> {
	const { data, meta } = payload;
	// subscription_payment_* events have subscription_invoice data type
	const attributes = data.attributes;

	logger.info(`Processing ${eventName} webhook`, {
		subscriptionId: attributes.subscription_id,
		invoiceId: data.id,
		status: attributes.status,
		total: attributes.total,
	});

	// Create a payment record for the subscription payment
	const userId = await findOrCreateUser(
		attributes.user_email,
		attributes.user_name,
		meta.custom_data
	);

	await db?.transaction(async (tx) => {
		await tx.insert(payments).values({
			userId,
			orderId: `${attributes.subscription_id}-${data.id}`, // Combine subscription and invoice ID
			amount: attributes.total || 0,
			status: eventName === "subscription_payment_success" ? "completed" : "failed",
			processor: "lemonsqueezy",
			metadata: JSON.stringify({
				// For subscriptions, we might not have product names directly
				// Use subscription info or fallback to generic names
				productName: "Subscription Payment",
				product_name: "Subscription Payment",

				subscription_id: attributes.subscription_id,
				invoice_id: data.id,
				billing_reason: attributes.billing_reason,
				card_brand: attributes.card_brand,
				card_last_four: attributes.card_last_four,
				currency: attributes.currency,
				total: attributes.total,
				test_mode: meta.test_mode,
				custom_data: meta.custom_data,
				webhook_event: eventName,
				created_at: attributes.created_at,
			}),
		});
	});

	logger.info(`Subscription payment ${eventName} processed successfully`, {
		subscriptionId: attributes.subscription_id,
		invoiceId: data.id,
		amount: attributes.total,
	});
}

export async function POST(request: Request) {
	const startTime = Date.now();
	const requestId = crypto.randomUUID();

	logger.info("Webhook request received", {
		requestId,
		timestamp: new Date().toISOString(),
		userAgent: request.headers.get("user-agent"),
	});

	try {
		// Get headers
		const headersList = await headers();
		const signature = headersList.get("x-signature");

		if (!signature) {
			logger.warn("Missing X-Signature header", { requestId });
			return new NextResponse("Missing signature", { status: 401 });
		}

		// Get raw body for signature verification
		const rawBody = await request.text();

		if (!rawBody) {
			logger.warn("Empty request body", { requestId });
			return new NextResponse("Empty body", { status: 400 });
		}

		// Verify webhook signature - CRITICAL for security!
		if (!verifyWebhookSignature(rawBody, signature)) {
			logger.error("Invalid webhook signature", { requestId });
			return new NextResponse("Invalid signature", { status: 401 });
		}

		// Parse webhook payload
		let payload: WebhookPayload;
		try {
			payload = JSON.parse(rawBody);
		} catch (error) {
			logger.error("Invalid JSON payload", { requestId, error });
			return new NextResponse("Invalid JSON", { status: 400 });
		}

		const { meta, data } = payload;
		const eventName = meta.event_name;

		logger.info("Processing webhook event", {
			requestId,
			eventName,
			dataId: data.id,
			dataType: data.type,
			testMode: meta.test_mode,
		});

		// Check for idempotency - prevent duplicate processing
		if (await isEventProcessed(data.id, eventName)) {
			logger.info("Event already processed", {
				requestId,
				eventName,
				dataId: data.id,
			});
			return new NextResponse("Event already processed", { status: 200 });
		}

		// Route to appropriate handler based on event type
		switch (eventName) {
			case "order_created":
				await handleOrderCreated(payload);
				break;

			case "order_refunded":
				await handleOrderRefunded(payload);
				break;

			case "subscription_created":
				await handleSubscriptionCreated(payload);
				break;

			case "subscription_updated":
			case "subscription_cancelled":
			case "subscription_resumed":
			case "subscription_expired":
			case "subscription_paused":
			case "subscription_unpaused":
				await handleSubscriptionStatusChange(payload, eventName);
				break;

			case "subscription_payment_success":
			case "subscription_payment_failed":
			case "subscription_payment_recovered":
				await handleSubscriptionPayment(payload, eventName);
				break;

			default:
				logger.info("Unhandled webhook event", {
					requestId,
					eventName,
					dataId: data.id,
				});
				// Return 200 for unhandled events to prevent retries
				return new NextResponse("Event not handled", { status: 200 });
		}

		const processingTime = Date.now() - startTime;
		logger.info("Webhook processed successfully", {
			requestId,
			eventName,
			dataId: data.id,
			processingTime,
		});

		return new NextResponse("Webhook processed", { status: 200 });
	} catch (error) {
		const processingTime = Date.now() - startTime;
		logger.error("Webhook processing failed", {
			requestId,
			error:
				error instanceof Error
					? {
							name: error.name,
							message: error.message,
							stack: error.stack,
						}
					: String(error),
			processingTime,
		});

		// Return 500 for processing errors to trigger Lemon Squeezy retries
		return new NextResponse("Webhook processing failed", { status: 500 });
	}
}

// Prevent GET requests
export async function GET() {
	return new NextResponse("Method not allowed", { status: 405 });
}
