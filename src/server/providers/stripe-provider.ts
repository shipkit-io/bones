import { eq, or } from "drizzle-orm";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import {
	createStripeCheckoutSession,
	createStripeCustomer,
	getAllStripeOrders,
	getStripeClient,
	getStripeCustomerByEmail,
	getStripePaymentStatus,
	hasUserPurchasedStripeProduct,
	processStripeWebhook,
	verifyStripeWebhookSignature,
} from "@/lib/stripe";
import { db } from "@/server/db";
import { payments } from "@/server/db/schema";
import { userService } from "../services/user-service";
import { BasePaymentProvider } from "./base-provider";
import {
	type CheckoutOptions,
	type ImportStats,
	type OrderData,
	PaymentProviderError,
	type ProductData,
	type ProviderConfig,
} from "./types";

/*
 * Extended provider config interface for Stripe-specific configuration
 */
interface StripeProviderConfig extends ProviderConfig {
	publishableKey?: string;
	webhookSecret?: string;
}

/*
 * Stripe implementation of the PaymentProvider interface
 *
 * @see https://stripe.com/docs/api
 * @see https://stripe.com/docs/checkout
 * @see https://stripe.com/docs/webhooks
 */
export class StripeProvider extends BasePaymentProvider {
	readonly name = "Stripe";
	readonly id = "stripe";
	private apiKey?: string;
	private publishableKey?: string;
	private webhookSecret?: string;

	/**
	 * Validate the provider configuration
	 */
	protected validateConfig(): void {
		// Check the feature flag first
		if (!env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
			this._isConfigured = false;
			this._isEnabled = false;
			logger.debug("Stripe feature flag disabled, provider not configured.");
			return;
		}

		// Cast config to Stripe-specific config type
		const stripeConfig = this._config as StripeProviderConfig;

		// Use config passed during initialization first, fallback to env
		this.apiKey = stripeConfig.apiKey ?? env.STRIPE_SECRET_KEY;
		this.publishableKey = stripeConfig.publishableKey ?? env.STRIPE_PUBLISHABLE_KEY;
		this.webhookSecret = stripeConfig.webhookSecret ?? env.STRIPE_WEBHOOK_SECRET;

		if (!this.apiKey) {
			logger.warn("Stripe API key not provided in config or environment variables.");
			this._isConfigured = false;
			return;
		}

		// Test Stripe client initialization
		try {
			const stripeClient = getStripeClient();
			if (!stripeClient) {
				logger.error("Failed to initialize Stripe client");
				this._isConfigured = false;
				return;
			}

			this._isConfigured = true;
			logger.debug("Stripe provider configured successfully");
		} catch (error) {
			logger.error("Failed to initialize Stripe client", { error });
			this._isConfigured = false;
		}
	}

	/**
	 * Get the payment status for a user
	 * @param userId The user ID
	 * @returns True if the user has a paid order
	 */
	async getPaymentStatus(userId: string): Promise<boolean> {
		try {
			this.checkProviderReady();

			const hasPayment = await getStripePaymentStatus(userId);
			logger.debug("Stripe payment status check", { userId, hasPayment });

			return hasPayment;
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				// If the provider is not configured, return false instead of throwing
				return false;
			}
			return this.handleError(error, "Error checking Stripe payment status");
		}
	}

	/**
	 * Check if user has purchased a specific product
	 * @param userId The user ID
	 * @param productId The product/price ID to check
	 * @returns True if the user has purchased the product
	 */
	async hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
		try {
			this.checkProviderReady();

			const hasPurchased = await hasUserPurchasedStripeProduct(userId, productId);
			logger.debug("Stripe product purchase check", { userId, productId, hasPurchased });

			return hasPurchased;
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return false;
			}
			return this.handleError(error, "Error checking Stripe product purchase");
		}
	}

	/**
	 * Check if user has an active subscription
	 * @param userId The user ID
	 * @returns True if the user has an active subscription
	 */
	async hasUserActiveSubscription(userId: string): Promise<boolean> {
		try {
			this.checkProviderReady();

			// Get the user email
			const userEmail = await this.getUserEmail(userId);
			if (!userEmail) return false;

			const stripe = getStripeClient();
			if (!stripe) return false;

			// Search for customers by email
			const customers = await stripe.customers.list({
				email: userEmail,
				limit: 1,
			});

			if (customers.data.length === 0) return false;

			const customer = customers.data[0];
			if (!customer) return false;

			// Check for active subscriptions
			const subscriptions = await stripe.subscriptions.list({
				customer: customer.id,
				status: "active",
				limit: 10,
			});

			return subscriptions.data.length > 0;
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return false;
			}
			return this.handleError(error, "Error checking Stripe active subscription");
		}
	}

	/**
	 * Get all products purchased by a user
	 * @param userId The user ID
	 * @returns Array of purchased products
	 */
	async getUserPurchasedProducts(userId: string): Promise<ProductData[]> {
		try {
			this.checkProviderReady();

			const products: ProductData[] = [];

			// Get the user email
			const userEmail = await this.getUserEmail(userId);
			if (!userEmail) return products;

			const stripe = getStripeClient();
			if (!stripe) return products;

			// Search for customers by email
			const customers = await stripe.customers.list({
				email: userEmail,
				limit: 1,
			});

			if (customers.data.length === 0) return products;

			const customer = customers.data[0];
			if (!customer) return products;

			// Get subscriptions
			const subscriptions = await stripe.subscriptions.list({
				customer: customer.id,
				limit: 100,
			});

			for (const subscription of subscriptions.data) {
				for (const item of subscription.items.data) {
					if (item.price.product) {
						try {
							const product = await stripe.products.retrieve(item.price.product as string);
							products.push({
								id: item.price.id,
								name: product.name,
								price: item.price.unit_amount ? item.price.unit_amount / 100 : undefined,
								description: product.description ?? undefined,
								isSubscription: true,
								provider: this.id,
								attributes: {
									productId: product.id,
									priceId: item.price.id,
									subscriptionId: subscription.id,
									status: subscription.status,
								},
							});
						} catch (error) {
							logger.warn("Error retrieving product for subscription", {
								subscriptionId: subscription.id,
								priceId: item.price.id,
								error,
							});
						}
					}
				}
			}

			return products;
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return [];
			}
			return this.handleError(error, "Error getting Stripe user purchased products");
		}
	}

	/**
	 * Get all orders from Stripe
	 * @returns Array of orders
	 */
	async getAllOrders(): Promise<OrderData[]> {
		try {
			this.checkProviderReady();

			const stripeOrders = await getAllStripeOrders();

			// Convert Stripe orders to standard OrderData format
			return stripeOrders.map((order) => ({
				id: order.id,
				orderId: order.orderId,
				userEmail: order.userEmail,
				userName: order.userName,
				amount: order.amount,
				// Map Stripe status to allowed OrderData status
				status: order.status === "failed" ? "pending" : order.status,
				productName: order.productName,
				purchaseDate: order.purchaseDate,
				processor: this.id,
				discountCode: order.discountCode,
				isFreeProduct: order.amount === 0,
				attributes: order.attributes,
			}));
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return [];
			}
			return this.handleError(error, "Error fetching Stripe orders");
		}
	}

	/**
	 * Get orders by email address
	 * @param email The email address to search for
	 * @returns Array of orders for that email
	 */
	async getOrdersByEmail(email: string): Promise<OrderData[]> {
		try {
			this.checkProviderReady();

			const allOrders = await this.getAllOrders();
			return allOrders.filter((order) => order.userEmail === email);
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return [];
			}
			return this.handleError(error, "Error fetching Stripe orders by email");
		}
	}

	/**
	 * Get a specific order by ID
	 * @param orderId The order ID to retrieve
	 * @returns The order if found, null otherwise
	 */
	async getOrderById(orderId: string): Promise<OrderData | null> {
		try {
			this.checkProviderReady();

			const allOrders = await this.getAllOrders();
			return allOrders.find((order) => order.orderId === orderId) ?? null;
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return null;
			}
			return this.handleError(error, "Error fetching Stripe order by ID");
		}
	}

	/**
	 * Import payments from Stripe
	 * @returns Statistics about the import process
	 */
	async importPayments(): Promise<ImportStats> {
		try {
			this.checkProviderReady();

			logger.debug("Starting Stripe payment import");
			const stats: ImportStats = {
				total: 0,
				imported: 0,
				skipped: 0,
				errors: 0,
				usersCreated: 0,
			};

			if (!db) {
				throw new Error("Database is not initialized");
			}

			// Get all orders from Stripe
			const stripeOrders = await this.getAllOrders();
			stats.total = stripeOrders.length;
			logger.debug(`Found ${stripeOrders.length} Stripe orders`);

			// Process each order
			for (const order of stripeOrders) {
				try {
					// Try to find or create user by email
					let userId = null;
					const userEmail = order.userEmail;
					const userName = order.userName;

					if (userEmail && userEmail !== "Unknown") {
						// Try to find existing user
						let user = await userService.getUserByEmail(userEmail);

						if (!user) {
							// Create new user using the findOrCreateUserByEmail method
							try {
								const { user: newUser, created } = await userService.findOrCreateUserByEmail(
									userEmail,
									{ name: userName ?? undefined }
								);
								user = newUser;
								if (created) {
									stats.usersCreated++;
									logger.debug("Created new user for Stripe order", {
										email: userEmail,
										orderId: order.orderId,
									});
								}
							} catch (createError) {
								logger.error("Failed to create user for Stripe order", {
									email: userEmail,
									orderId: order.orderId,
									error: createError,
								});
								stats.errors++;
								continue;
							}
						}

						if (user) {
							userId = user.id;
						}
					}

					// Check if payment already exists by either orderId or processorOrderId
					const existingPayment = await db.query.payments.findFirst({
						where: (payments, { eq, or }) =>
							or(eq(payments.orderId, order.orderId), eq(payments.processorOrderId, order.orderId)),
					});

					if (existingPayment) {
						logger.debug(`Stripe order ${order.orderId} already imported, skipping`);
						stats.skipped++;
						continue;
					}

					// Create new payment record - only if we have a userId
					if (userId) {
						await db.insert(payments).values({
							orderId: order.orderId,
							processorOrderId: order.orderId, // Store the raw Stripe order ID
							userId,
							amount: Math.round(order.amount * 100), // Convert to cents for storage
							status: order.status === "paid" ? "completed" : order.status,
							processor: this.id,
							productName: order.productName, // Store the extracted product name
							createdAt: order.purchaseDate,
							updatedAt: new Date(),
							metadata: JSON.stringify({
								// Store product information at top level for easy access
								productName: order.productName || "Unknown Product",
								product_name: order.productName || "Unknown Product",
								// Store complete order data for reference
								order_data: order.attributes,
							}),
						});

						logger.debug(`Imported ${this.name} order ${order.orderId}`);
						stats.imported++;
					} else {
						logger.debug(`Skipping ${this.name} order ${order.orderId} - no user found or created`);
						stats.skipped++;
					}
				} catch (error) {
					logger.error(`Error importing ${this.name} order ${order.orderId}`, error);
					stats.errors++;
				}
			}

			logger.info(`${this.name} payment import complete`, stats);
			return stats;
		} catch (error) {
			return this.handleError(error, `Error importing ${this.name} payments`);
		}
	}

	/**
	 * Create a checkout URL for a product
	 * @param options Checkout options
	 * @returns The checkout URL
	 */
	async createCheckoutUrl(options: CheckoutOptions): Promise<string | null> {
		try {
			this.checkProviderReady();

			logger.debug(`Creating ${this.name} checkout URL`, { options });

			// Map CheckoutOptions to Stripe checkout options
			const stripeOptions = {
				priceId: options.productId, // In Stripe, productId is actually the price ID
				successUrl: options.successUrl ?? `${process.env.NEXT_PUBLIC_URL}/checkout/success`,
				cancelUrl: options.cancelUrl ?? `${process.env.NEXT_PUBLIC_URL}/pricing`,
				customerEmail: options.email,
				metadata: options.metadata,
				allowPromotionCodes: true,
				mode: "payment" as const, // Default to payment mode
				quantity: 1, // Default quantity
			};

			const checkoutUrl = await createStripeCheckoutSession(stripeOptions);

			if (checkoutUrl) {
				logger.debug(`${this.name} checkout URL created successfully`, {
					priceId: options.productId,
					url: checkoutUrl,
				});
			}

			return checkoutUrl;
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return null;
			}
			return this.handleError(error, `Error creating ${this.name} checkout URL`);
		}
	}

	/**
	 * Handle incoming webhook events from Stripe
	 */
	async handleWebhookEvent(event: any): Promise<void> {
		try {
			this.checkProviderReady();

			// Verify webhook signature
			const signature = event.headers?.["stripe-signature"];
			const payload = event.body;

			if (signature && payload) {
				const isValid = verifyStripeWebhookSignature(payload, signature);
				if (!isValid) {
					logger.error("Invalid Stripe webhook signature");
					throw new PaymentProviderError("Invalid webhook signature", this.id, "invalid_signature");
				}
			}

			// Process the webhook event
			await processStripeWebhook(event);
			logger.info("Processed Stripe webhook event", { type: event?.type });
		} catch (error) {
			// Don't re-throw if it's just not configured
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				logger.warn("Received Stripe webhook, but provider not configured. Skipping.");
				return;
			}
			this.handleError(error, "Error handling Stripe webhook event");
		}
	}

	/**
	 * List available products from Stripe (placeholder implementation)
	 * Note: Stripe doesn't have a simple "list all products" approach for checkout
	 * This would typically be configured in your application with specific price IDs
	 */
	async listProducts(): Promise<ProductData[]> {
		try {
			this.checkProviderReady();

			// This is a placeholder - in a real implementation, you would either:
			// 1. Configure specific price IDs in your app config
			// 2. Fetch products and their prices from Stripe API
			// 3. Use a combination of both

			logger.debug("Stripe listProducts called - returning empty array");
			return [];
		} catch (error) {
			if (error instanceof PaymentProviderError && error.code === "provider_not_configured") {
				return [];
			}
			return this.handleError(error, "Error listing Stripe products");
		}
	}

	/**
	 * Get provider-specific configuration that can be safely exposed to client
	 */
	getPublicConfig(): Record<string, any> {
		return {
			name: this.name,
			id: this.id,
			isConfigured: this._isConfigured,
			isEnabled: this._isEnabled,
			publishableKey: this.publishableKey, // Safe to expose
		};
	}
}

// Export singleton instance
export const stripeProvider = new StripeProvider();
