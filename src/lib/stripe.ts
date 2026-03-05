import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { payments, users } from "@/server/db/schema";
import type {
	StripeCheckoutOptions,
	StripeCustomer,
	StripeOrder,
	StripePaymentData,
	StripeSubscription,
	StripeWebhookEvent,
} from "@/types/stripe";

/*
 * Stripe payment processor utilities
 *
 * @see https://stripe.com/docs/api
 * @see https://stripe.com/docs/webhooks
 * @see https://docs.stripe.com/checkout/quickstart
 */

let stripeInstance: Stripe | null = null;

/**
 * Initialize Stripe client with proper configuration
 * This function ensures the Stripe client is properly configured with API key and version
 */
const initializeStripeClient = (): Stripe | null => {
	if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
		logger.debug("Stripe feature is disabled. Skipping initialization.");
		return null;
	}

	if (!env.STRIPE_SECRET_KEY) {
		logger.error("STRIPE_SECRET_KEY is not set in the environment.");
		return null;
	}

	try {
		if (!stripeInstance) {
			stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
				apiVersion: (env.STRIPE_API_VERSION as Stripe.LatestApiVersion) ?? "2023-10-16",
				typescript: true,
			});
			logger.debug("Stripe client initialized successfully");
		}
		return stripeInstance;
	} catch (error) {
		logger.error("Failed to initialize Stripe client:", error);
		return null;
	}
};

/**
 * Get Stripe client instance
 */
export const getStripeClient = (): Stripe | null => {
	return stripeInstance || initializeStripeClient();
};

/**
 * Create a Stripe checkout session
 *
 * @param options Checkout session configuration
 * @returns Promise resolving to checkout session URL or null
 */
export const createStripeCheckoutSession = async (
	options: StripeCheckoutOptions
): Promise<string | null> => {
	if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
		logger.debug("Stripe feature is disabled. Skipping checkout session creation.");
		return null;
	}

	try {
		const stripe = getStripeClient();
		if (!stripe) {
			logger.error("Stripe client not available");
			return null;
		}

		logger.debug("Creating Stripe checkout session", { priceId: options.priceId });

		const sessionParams: Stripe.Checkout.SessionCreateParams = {
			mode: options.mode ?? "payment",
			payment_method_types: ["card"],
			line_items: [
				{
					price: options.priceId,
					quantity: options.quantity ?? 1,
				},
			],
			success_url: options.successUrl,
			cancel_url: options.cancelUrl,
			metadata: options.metadata ?? {},
		};

		// Add customer information if provided
		if (options.customerId) {
			sessionParams.customer = options.customerId;
		} else if (options.customerEmail) {
			sessionParams.customer_email = options.customerEmail;
		}

		// Enable promotion codes if requested
		if (options.allowPromotionCodes) {
			sessionParams.allow_promotion_codes = true;
		}

		const session = await stripe.checkout.sessions.create(sessionParams);

		logger.debug("Stripe checkout session created successfully", {
			sessionId: session.id,
			url: session.url,
		});

		return session.url;
	} catch (error) {
		logger.error("Error creating Stripe checkout session:", error);
		return null;
	}
};

/**
 * Retrieve a checkout session by ID
 *
 * @param sessionId Stripe checkout session ID
 * @returns Promise resolving to checkout session or null
 */
export const getStripeCheckoutSession = async (
	sessionId: string
): Promise<Stripe.Checkout.Session | null> => {
	if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
		logger.debug("Stripe feature is disabled. Skipping session retrieval.");
		return null;
	}

	try {
		const stripe = getStripeClient();
		if (!stripe) return null;

		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ["line_items", "customer", "subscription"],
		});

		return session;
	} catch (error) {
		logger.error("Error retrieving Stripe checkout session:", error);
		return null;
	}
};

/**
 * Get payment status for a user
 *
 * @param userId User ID to check
 * @returns Promise resolving to true if user has paid
 */
export const getStripePaymentStatus = async (userId: string): Promise<boolean> => {
	if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
		logger.debug("Stripe feature is disabled. Skipping payment status check.");
		return false;
	}

	logger.debug("Checking Stripe payment status for user", { userId });

	try {
		// First check the database for existing payment records
		const payment = await db?.query.payments.findFirst({
			where: eq(payments.userId, userId),
			columns: {
				id: true,
				processor: true,
				status: true,
			},
		});

		// If we have a payment record with Stripe as the processor, return true
		if (payment && payment.processor === "stripe" && payment.status === "completed") {
			logger.debug("Found completed Stripe payment in database", { userId });
			return true;
		}

		// Get the user's email to check Stripe records
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				email: true,
			},
		});

		if (!user?.email) {
			logger.debug("User email not found", { userId });
			return false;
		}

		// Check Stripe for payments by email
		const stripe = getStripeClient();
		if (!stripe) return false;

		// Search for customers by email
		const customers = await stripe.customers.list({
			email: user.email,
			limit: 1,
		});

		if (customers.data.length === 0) {
			logger.debug("No Stripe customer found for email", { email: user.email });
			return false;
		}

		const customer = customers.data[0];

		// Check for successful payments
		const paymentIntents = await stripe.paymentIntents.list({
			customer: customer?.id,
			limit: 10,
		});

		const hasSuccessfulPayment = paymentIntents.data.some(
			(payment) => payment.status === "succeeded"
		);

		// Check for active subscriptions
		const subscriptions = await stripe.subscriptions.list({
			customer: customer?.id,
			status: "active",
			limit: 10,
		});

		const hasActiveSubscription = subscriptions.data.length > 0;

		const hasPaid = hasSuccessfulPayment || hasActiveSubscription;

		logger.debug("Stripe payment status check complete", {
			userId,
			email: user.email,
			hasSuccessfulPayment,
			hasActiveSubscription,
			hasPaid,
		});

		return hasPaid;
	} catch (error) {
		logger.error("Error checking Stripe payment status:", error);
		return false;
	}
};

/**
 * Check if user has purchased a specific product
 *
 * @param userId User ID to check
 * @param priceId Stripe price ID to check
 * @returns Promise resolving to true if user has purchased the product
 */
export const hasUserPurchasedStripeProduct = async (
	userId: string,
	priceId: string
): Promise<boolean> => {
	if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
		logger.debug("Stripe feature is disabled. Skipping product purchase check.");
		return false;
	}

	logger.debug("Checking if user purchased Stripe product", { userId, priceId });

	try {
		// Check if the user has any payment
		const hasPayment = await getStripePaymentStatus(userId);
		if (!hasPayment) {
			return false;
		}

		// Get the user email
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				email: true,
			},
		});

		if (!user?.email) return false;

		const stripe = getStripeClient();
		if (!stripe) return false;

		// Search for customers by email
		const customers = await stripe.customers.list({
			email: user.email,
			limit: 1,
		});

		if (customers.data.length === 0) return false;

		const customer = customers.data[0];

		// Check payment intents for the specific price
		const paymentIntents = await stripe.paymentIntents.list({
			customer: customer?.id,
			limit: 100,
		});

		for (const paymentIntent of paymentIntents.data) {
			if (paymentIntent.status === "succeeded") {
				// For one-time payments, we'll check if the payment intent has metadata
				// that indicates the price ID, but this requires the price ID to be stored
				// in metadata when creating the payment intent
				if (paymentIntent.metadata?.priceId === priceId) {
					return true;
				}
			}
		}

		// Check subscriptions for the specific price
		const subscriptions = await stripe.subscriptions.list({
			customer: customer?.id,
			limit: 100,
		});

		for (const subscription of subscriptions.data) {
			const hasPriceId = subscription.items.data.some((item) => item.price.id === priceId);
			if (hasPriceId && subscription.status === "active") return true;
		}

		return false;
	} catch (error) {
		logger.error("Error checking if user purchased Stripe product:", error);
		return false;
	}
};

/**
 * Get all orders for Stripe (for admin purposes)
 *
 * @returns Promise resolving to array of orders
 */
export const getAllStripeOrders = async (): Promise<StripeOrder[]> => {
	if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
		logger.debug("Stripe feature is disabled. Skipping order retrieval.");
		return [];
	}

	try {
		const stripe = getStripeClient();
		if (!stripe) return [];

		const orders: StripeOrder[] = [];

		// Get payment intents
		const paymentIntents = await stripe.paymentIntents.list({
			limit: 100,
		});

		for (const paymentIntent of paymentIntents.data) {
			if (paymentIntent.status === "succeeded" && paymentIntent.customer) {
				const customer = await stripe.customers.retrieve(paymentIntent.customer as string);

				if (customer && !customer.deleted) {
					// Enhanced product name extraction for payment intents
					let productName = "Unknown Product";

					// Try to get product name from various sources
					if (paymentIntent.description) {
						productName = paymentIntent.description;
					} else if (paymentIntent.metadata?.product_name) {
						productName = paymentIntent.metadata.product_name;
					} else if (paymentIntent.metadata?.description) {
						productName = paymentIntent.metadata.description;
					}

					// If we have line items, try to get product information from them
					try {
						if (paymentIntent.latest_charge) {
							const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);

							// Try to get product information from payment intent metadata or invoice
							if (charge.metadata?.product_name) {
								productName = charge.metadata.product_name;
							} else if (charge.description) {
								productName = charge.description;
							}
						}
					} catch (error) {
						// Fallback to existing logic if charge retrieval fails
						logger.debug("Could not retrieve charge information for payment intent", {
							paymentIntentId: paymentIntent.id,
							error: error instanceof Error ? error.message : String(error),
						});
					}

					orders.push({
						id: paymentIntent.id,
						orderId: paymentIntent.id,
						userEmail: customer.email ?? "Unknown",
						userName: customer.name ?? null,
						amount: paymentIntent.amount / 100, // Convert from cents
						status: "paid",
						productName,
						purchaseDate: new Date(paymentIntent.created * 1000),
						discountCode: null,
						attributes: paymentIntent,
						isSubscription: false,
						customerId: customer.id,
					});
				}
			}
		}

		// Get subscriptions
		const subscriptions = await stripe.subscriptions.list({
			limit: 100,
		});

		for (const subscription of subscriptions.data) {
			const customer = await stripe.customers.retrieve(subscription.customer as string);

			if (customer && !customer.deleted) {
				const priceId = subscription.items.data[0]?.price.id;
				let productName = "Unknown Product";

				// Enhanced product name extraction with fallback hierarchy
				if (priceId) {
					try {
						const price = await stripe.prices.retrieve(priceId);

						// Try to get product name from the product
						if (price.product) {
							const product = await stripe.products.retrieve(price.product as string);
							productName = product.name || price.nickname || "Subscription";
						} else if (price.nickname) {
							productName = price.nickname;
						}
					} catch (error) {
						logger.warn("Error retrieving product name for subscription", {
							subscriptionId: subscription.id,
							priceId,
							error: error instanceof Error ? error.message : String(error),
						});

						// Fallback to subscription metadata or description
						if (subscription.metadata?.product_name) {
							productName = subscription.metadata.product_name;
						} else if (subscription.description) {
							productName = subscription.description;
						} else {
							productName = "Subscription";
						}
					}
				}

				orders.push({
					id: subscription.id,
					orderId: subscription.id,
					userEmail: customer.email ?? "Unknown",
					userName: customer.name ?? null,
					amount: subscription.items.data[0]?.price.unit_amount
						? subscription.items.data[0].price.unit_amount / 100
						: 0,
					status: subscription.status === "active" ? "paid" : "pending",
					productName,
					purchaseDate: new Date(subscription.created * 1000),
					discountCode: null,
					attributes: subscription,
					isSubscription: true,
					subscriptionId: subscription.id,
					customerId: customer.id,
					priceId,
				});
			}
		}

		return orders;
	} catch (error) {
		logger.error("Error fetching Stripe orders:", error);
		return [];
	}
};

/**
 * Process Stripe webhook events
 *
 * @param event Stripe webhook event
 * @returns Promise resolving when processing is complete
 */
export const processStripeWebhook = async (event: StripeWebhookEvent): Promise<void> => {
	if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
		logger.warn("Received Stripe webhook, but Stripe feature is disabled. Skipping processing.", {
			eventType: event.type,
		});
		return;
	}

	logger.info("Processing Stripe webhook event", { type: event.type, id: event.id });

	try {
		const stripe = getStripeClient();
		if (!stripe) {
			logger.error("Stripe client not available for webhook processing");
			return;
		}

		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				logger.debug("Processing checkout session completed", { sessionId: session.id });

				if (session.payment_status === "paid" && session.customer) {
					const customer = await stripe.customers.retrieve(session.customer as string);

					if (customer && !customer.deleted) {
						// Create payment record
						// This would typically call PaymentService.createPayment
						logger.info("Checkout session completed successfully", {
							sessionId: session.id,
							customerId: customer.id,
							customerEmail: customer.email,
							amount: session.amount_total,
						});
					}
				}
				break;
			}

			case "payment_intent.succeeded": {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				logger.debug("Processing payment intent succeeded", { paymentIntentId: paymentIntent.id });

				if (paymentIntent.customer) {
					const customer = await stripe.customers.retrieve(paymentIntent.customer as string);

					if (customer && !customer.deleted) {
						logger.info("Payment intent succeeded", {
							paymentIntentId: paymentIntent.id,
							customerId: customer.id,
							customerEmail: customer.email,
							amount: paymentIntent.amount,
						});
					}
				}
				break;
			}

			case "customer.subscription.created":
			case "customer.subscription.updated": {
				const subscription = event.data.object as Stripe.Subscription;
				logger.debug("Processing subscription event", {
					subscriptionId: subscription.id,
					status: subscription.status,
					eventType: event.type,
				});

				const customer = await stripe.customers.retrieve(subscription.customer as string);

				if (customer && !customer.deleted) {
					logger.info("Subscription event processed", {
						subscriptionId: subscription.id,
						customerId: customer.id,
						customerEmail: customer.email,
						status: subscription.status,
						eventType: event.type,
					});
				}
				break;
			}

			case "customer.subscription.deleted": {
				const subscription = event.data.object as Stripe.Subscription;
				logger.debug("Processing subscription deletion", { subscriptionId: subscription.id });

				const customer = await stripe.customers.retrieve(subscription.customer as string);

				if (customer && !customer.deleted) {
					logger.info("Subscription deleted", {
						subscriptionId: subscription.id,
						customerId: customer.id,
						customerEmail: customer.email,
					});
				}
				break;
			}

			case "invoice.payment_succeeded":
			case "invoice.payment_failed": {
				const invoice = event.data.object as Stripe.Invoice;
				logger.debug("Processing invoice event", {
					invoiceId: invoice.id,
					status: invoice.status,
					eventType: event.type,
				});

				if (invoice.customer) {
					const customer = await stripe.customers.retrieve(invoice.customer as string);

					if (customer && !customer.deleted) {
						logger.info("Invoice event processed", {
							invoiceId: invoice.id,
							customerId: customer.id,
							customerEmail: customer.email,
							status: invoice.status,
							eventType: event.type,
						});
					}
				}
				break;
			}

			default:
				logger.debug("Unhandled Stripe webhook event type", { type: event.type });
		}
	} catch (error) {
		logger.error("Error processing Stripe webhook:", error);
		throw error;
	}
};

/**
 * Verify Stripe webhook signature
 *
 * @param payload Raw webhook payload
 * @param signature Stripe signature header
 * @param secret Webhook secret
 * @returns True if signature is valid
 */
export const verifyStripeWebhookSignature = (
	payload: string,
	signature: string,
	secret?: string
): boolean => {
	if (!secret && !env.STRIPE_WEBHOOK_SECRET) {
		logger.error("Missing Stripe webhook secret");
		return false;
	}

	try {
		const stripe = getStripeClient();
		if (!stripe) {
			logger.error("Stripe client not available for signature verification");
			return false;
		}

		stripe.webhooks.constructEvent(payload, signature, secret || env.STRIPE_WEBHOOK_SECRET!);
		return true;
	} catch (error) {
		logger.error("Stripe webhook signature verification failed:", error);
		return false;
	}
};

/**
 * Create Stripe customer
 *
 * @param email Customer email
 * @param name Customer name (optional)
 * @param metadata Additional metadata (optional)
 * @returns Promise resolving to Stripe customer or null
 */
export const createStripeCustomer = async (
	email: string,
	name?: string,
	metadata?: Record<string, string>
): Promise<StripeCustomer | null> => {
	if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
		logger.debug("Stripe feature is disabled. Skipping customer creation.");
		return null;
	}

	try {
		const stripe = getStripeClient();
		if (!stripe) return null;

		const customer = await stripe.customers.create({
			email,
			name,
			metadata,
		});

		logger.debug("Stripe customer created", { customerId: customer.id, email });

		return {
			id: customer.id,
			email: customer.email!,
			name: customer.name ?? undefined,
			metadata: customer.metadata,
		};
	} catch (error) {
		logger.error("Error creating Stripe customer:", error);
		return null;
	}
};

/**
 * Get Stripe customer by email
 *
 * @param email Customer email
 * @returns Promise resolving to Stripe customer or null
 */
export const getStripeCustomerByEmail = async (email: string): Promise<StripeCustomer | null> => {
	if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
		logger.debug("Stripe feature is disabled. Skipping customer lookup.");
		return null;
	}

	try {
		const stripe = getStripeClient();
		if (!stripe) return null;

		const customers = await stripe.customers.list({
			email,
			limit: 1,
		});

		if (customers.data.length === 0) {
			return null;
		}

		const customer = customers.data[0];
		if (!customer) {
			return null;
		}

		return {
			id: customer.id,
			email: customer.email!,
			name: customer.name ?? undefined,
			metadata: customer.metadata,
		};
	} catch (error) {
		logger.error("Error getting Stripe customer by email:", error);
		return null;
	}
};
