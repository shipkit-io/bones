import { lemonSqueezySetup, listOrders, listProducts } from "@lemonsqueezy/lemonsqueezy.js";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { payments, users } from "@/server/db/schema";
import { userService } from "../services/user-service";
import { BasePaymentProvider } from "./base-provider";
import type { CheckoutOptions, ImportStats, OrderData, ProductData } from "./types";

/**
 * LemonSqueezy implementation of the PaymentProvider interface
 */
export class LemonSqueezyProvider extends BasePaymentProvider {
	readonly name = "Lemon Squeezy";
	readonly id = "lemonsqueezy";
	private apiKey?: string;

	constructor() {
		super();
		// Auto-initialize if environment variables are available
		if (env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED && env.LEMONSQUEEZY_API_KEY) {
			this.initialize({
				apiKey: env.LEMONSQUEEZY_API_KEY,
			});
		}
	}

	/**
	 * Validate the provider configuration
	 */
	protected validateConfig(): void {
		// Check the feature flag first
		if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
			logger.warn("LemonSqueezy feature is disabled");
			this._isConfigured = false;
			return;
		}

		this.apiKey = this._config.apiKey || env.LEMONSQUEEZY_API_KEY;

		if (!this.apiKey) {
			logger.warn("Lemon Squeezy API key not provided");
			this._isConfigured = false;
			return;
		}

		try {
			// Initialize the LemonSqueezy client
			lemonSqueezySetup({ apiKey: this.apiKey });
			this._isConfigured = true;
		} catch (error) {
			logger.error("❌ Failed to initialize Lemon Squeezy client", { error });
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

			const userEmail = await this.getUserEmail(userId);
			if (!userEmail) {
				return false;
			}

			// Check LemonSqueezy orders by both user ID and email
			const orders = await listOrders({});
			const userOrders =
				orders.data?.data?.filter((order) => {
					const attributes = order.attributes as any;
					const customData = attributes.custom_data || {};

					// Check if either the user ID matches or the email matches
					return (
						(typeof customData === "object" && customData?.user_id === userId) ||
						attributes.user_email?.toLowerCase() === userEmail.toLowerCase()
					);
				}) ?? [];

			const hasPaid = userOrders.some((order) => order.attributes.status === "paid");

			return hasPaid;
		} catch (error) {
			if (error instanceof Error && error.message.includes("not properly configured")) {
				// If the provider is not configured, return false instead of throwing
				return false;
			}
			return this.handleError(error, "Error checking Lemon Squeezy payment status");
		}
	}

	/**
	 * Check if a user has purchased a specific product
	 * @param userId The user ID
	 * @param productId The product ID or variant ID to check for
	 * @returns True if the user has purchased the product
	 */
	async hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
		try {
			this.checkProviderReady();
			logger.debug(`Checking if user ${userId} has purchased product/variant ${productId}`);

			const userEmail = await this.getUserEmail(userId);
			if (!userEmail) {
				logger.debug(`No email found for user ${userId}`);
				return false;
			}

			// Get user orders
			const orders = await listOrders({});
			logger.debug(`Retrieved ${orders.data?.data?.length || 0} orders from LemonSqueezy`);

			const userOrders =
				orders.data?.data?.filter((order) => {
					const attributes = order.attributes as any;
					const customData = attributes.custom_data || {};

					// Check if either the user ID matches or the email matches
					const isUserOrder =
						(typeof customData === "object" && customData?.user_id === userId) ||
						attributes.user_email?.toLowerCase() === userEmail.toLowerCase();

					if (isUserOrder) {
						logger.debug(`Found user order: ${order.id}, status: ${attributes.status}`);
					}

					return isUserOrder;
				}) ?? [];

			// Parse the product ID to handle both string and number formats
			const parsedId = String(productId);

			// Check if any paid order includes the specific product ID or variant ID
			const hasPurchased = userOrders.some((order) => {
				const attributes = order.attributes;
				const firstOrderItem = attributes.first_order_item;

				if (!firstOrderItem) {
					return false;
				}

				// Log the product information for debugging
				logger.debug(
					`Order ${order.id} - product_id: ${firstOrderItem.product_id}, variant_id: ${firstOrderItem.variant_id}, comparing with ${parsedId}`
				);

				// Check if order is paid and contains the product or variant
				const orderHasProduct =
					attributes.status === "paid" &&
					(String(firstOrderItem.product_id) === parsedId ||
						String(firstOrderItem.variant_id) === parsedId);

				if (orderHasProduct) {
					logger.debug(
						`Found matching product/variant purchase for user ${userId}, ID ${productId}`
					);
				}

				return orderHasProduct;
			});

			logger.debug(`User ${userId} has purchased product/variant ${productId}: ${hasPurchased}`);
			return hasPurchased;
		} catch (error) {
			if (error instanceof Error && error.message.includes("not properly configured")) {
				return false;
			}
			return this.handleError(error, "Error checking Lemon Squeezy product purchase");
		}
	}

	/**
	 * Check if a user has purchased a specific product by variant ID specifically
	 * @param userId The user ID
	 * @param variantId The variant ID to check for
	 * @returns True if the user has purchased the variant
	 */
	async hasUserPurchasedVariant(userId: string, variantId: string | number): Promise<boolean> {
		try {
			this.checkProviderReady();
			logger.debug(`Checking if user ${userId} has purchased variant ${variantId}`);

			const userEmail = await this.getUserEmail(userId);
			if (!userEmail) {
				logger.debug(`No email found for user ${userId}`);
				return false;
			}

			// Get user orders
			const orders = await listOrders({});
			const userOrders =
				orders.data?.data?.filter((order) => {
					const attributes = order.attributes as any;
					const customData = attributes.custom_data || {};

					// Check if either the user ID matches or the email matches
					return (
						(typeof customData === "object" && customData?.user_id === userId) ||
						attributes.user_email?.toLowerCase() === userEmail.toLowerCase()
					);
				}) ?? [];

			// Check if any paid order includes the specific variant ID
			const hasPurchased = userOrders.some((order) => {
				const attributes = order.attributes;
				const firstOrderItem = attributes.first_order_item;

				// Check if order is paid and contains the product variant
				return (
					attributes.status === "paid" &&
					firstOrderItem &&
					String(firstOrderItem.variant_id) === String(variantId)
				);
			});

			logger.debug(`User ${userId} has purchased variant ${variantId}: ${hasPurchased}`);
			return hasPurchased;
		} catch (error) {
			if (error instanceof Error && error.message.includes("not properly configured")) {
				return false;
			}
			return this.handleError(error, "Error checking Lemon Squeezy variant purchase");
		}
	}

	/**
	 * Check if a user has an active subscription
	 * @param userId The user ID
	 * @returns True if the user has an active subscription
	 */
	async hasUserActiveSubscription(userId: string): Promise<boolean> {
		try {
			this.checkProviderReady();

			const userEmail = await this.getUserEmail(userId);
			if (!userEmail) {
				return false;
			}

			// Get user subscriptions
			try {
				// We need to use the Lemon Squeezy SDK to get subscriptions
				// Type assertion here since the SDK types may not be complete
				const lemonClient = lemonSqueezySetup({
					apiKey: this.apiKey ?? "",
				}) as any;

				const response = await lemonClient.subscriptions?.list();

				// Filter subscriptions for this user
				const userSubscriptions =
					response?.data?.data?.filter((subscription: any) => {
						const attributes = subscription.attributes;
						const customData = attributes.custom_data || {};

						// Check if either the user ID matches or the email matches
						return (
							(typeof customData === "object" && customData?.user_id === userId) ||
							attributes.user_email?.toLowerCase() === userEmail.toLowerCase()
						);
					}) ?? [];

				// Check if any subscription is active
				const hasActiveSubscription = userSubscriptions.some((subscription: any) => {
					const attributes = subscription.attributes;
					return attributes.status === "active";
				});

				return hasActiveSubscription;
			} catch (error) {
				logger.error("Error checking Lemon Squeezy subscriptions:", error);
				return false;
			}
		} catch (error) {
			if (error instanceof Error && error.message.includes("not properly configured")) {
				return false;
			}
			return this.handleError(error, "Error checking Lemon Squeezy subscription");
		}
	}

	/**
	 * Get all products a user has purchased
	 * @param userId The user ID
	 * @returns Array of purchased products
	 */
	async getUserPurchasedProducts(userId: string): Promise<ProductData[]> {
		try {
			this.checkProviderReady();

			const userEmail = await this.getUserEmail(userId);
			if (!userEmail) {
				return [];
			}

			// Get user orders with enhanced product information
			const orders = await listOrders({
				include: ["order-items", "customer"],
			});
			const userOrders =
				orders.data?.data?.filter((order) => {
					const attributes = order.attributes as any;
					const customData = attributes.custom_data || {};

					// Check if either the user ID matches or the email matches
					return (
						(typeof customData === "object" && customData?.user_id === userId) ||
						attributes.user_email?.toLowerCase() === userEmail.toLowerCase()
					);
				}) ?? [];

			// Extract unique products from paid orders
			const purchasedVariantIds = new Set<number>();
			const purchasedProducts: ProductData[] = [];

			// Enhanced product name extraction function
			const getEnhancedProductName = (orderItem: any): string => {
				if (!orderItem) {
					return "Unknown Product";
				}

				const productName = orderItem.product_name;
				const variantName = orderItem.variant_name;

				// Return just the product name since we now show variant separately
				return productName || "Unknown Product";
			};

			// Use for...of loop instead of forEach
			for (const order of userOrders) {
				const attributes = order.attributes;

				// Only consider paid orders
				if (attributes.status === "paid" && attributes.first_order_item) {
					const variantId = attributes.first_order_item.variant_id;

					// Only add each variant once
					if (!purchasedVariantIds.has(variantId)) {
						purchasedVariantIds.add(variantId);
						purchasedProducts.push({
							id: String(attributes.first_order_item.product_id),
							name: getEnhancedProductName(attributes.first_order_item),
							price: attributes.first_order_item.price / 100, // Convert cents to dollars
							provider: this.id,
							attributes: {
								variant_id: variantId,
								variant_name: attributes.first_order_item.variant_name,
								product_name: attributes.first_order_item.product_name,
								purchaseDate: new Date(attributes.created_at),
							},
						});
					}
				}
			}

			return purchasedProducts;
		} catch (error) {
			if (error instanceof Error && error.message.includes("not properly configured")) {
				return [];
			}
			return this.handleError(error, "Error getting Lemon Squeezy purchased products");
		}
	}

	/**
	 * Get all orders from Lemon Squeezy
	 * @returns Array of orders
	 */
	async getAllOrders(): Promise<OrderData[]> {
		try {
			this.checkProviderReady();

			// Include order-items in the response to get detailed product information
			const response = await listOrders({
				include: ["order-items", "customer"],
			});

			if (!response || !Array.isArray(response.data?.data)) {
				return [];
			}

			return response.data.data.map((order) => {
				const attributes = order.attributes;

				// Use subtotal as the amount field since total is often returning 0
				const amount = attributes.subtotal > 0 ? attributes.subtotal / 100 : 0;

				// Extract all possible user information
				// Use type assertion for additional fields that might be in the API but not in our types
				const attr = attributes as any;

				// Process any custom user data
				const customUserData: Record<string, any> = {};
				if (attr.custom_data && typeof attr.custom_data === "object") {
					for (const [key, value] of Object.entries(attr.custom_data)) {
						if (key.startsWith("user_")) {
							customUserData[key] = value;
						}
					}
				}

				// Enhanced product name extraction from order items
				const getProductName = (): string => {
					const orderItem = attributes.first_order_item;

					if (!orderItem) {
						return "Unknown Product";
					}

					const productName = orderItem.product_name;
					const variantName = orderItem.variant_name;

					// Create a meaningful product name based on available information
					if (productName && variantName) {
						// If both exist, check if variant name is just a copy of product name
						if (variantName === productName) {
							return productName;
						}
						// If they're different, show both for clarity
						return `${productName} - ${variantName}`;
					}

					// Fallback to whichever is available
					return variantName || productName || "Unknown Product";
				};

				return {
					id: order.id,
					orderId: attributes.identifier,
					userEmail: attributes.user_email ?? "Unknown",
					userName: attributes.user_name,
					amount,
					status: attributes.status as "paid" | "refunded" | "pending",
					productName: getProductName(),
					purchaseDate: new Date(attributes.created_at),
					processor: this.id,
					discountCode: (attr.discount_code || null) as string | null,
					isFreeProduct: amount === 0,
					attributes,
				};
			});
		} catch (error) {
			if (error instanceof Error && error.message.includes("not properly configured")) {
				return [];
			}
			return this.handleError(error, "Error fetching Lemon Squeezy orders");
		}
	}

	/**
	 * Get orders for a specific email
	 * @param email The email to search for
	 * @returns Array of orders
	 */
	async getOrdersByEmail(email: string): Promise<OrderData[]> {
		try {
			this.checkProviderReady();

			// Include order-items in the response to get detailed product information
			const response = await listOrders({
				filter: {
					userEmail: email.trim(),
				},
				include: ["order-items", "customer"],
			});

			if (!response || !Array.isArray(response.data?.data)) {
				return [];
			}

			return response.data.data.map((order) => {
				const attributes = order.attributes;
				const amount = attributes.subtotal > 0 ? attributes.subtotal / 100 : 0;
				const attr = attributes as any;

				// Enhanced product name extraction from order items
				const getProductName = (): string => {
					const orderItem = attributes.first_order_item;

					if (!orderItem) {
						return "Unknown Product";
					}

					const productName = orderItem.product_name;
					const variantName = orderItem.variant_name;

					// Create a meaningful product name based on available information
					if (productName && variantName) {
						// If both exist, check if variant name is just a copy of product name
						if (variantName === productName) {
							return productName;
						}
						// If they're different, show both for clarity
						return `${productName} - ${variantName}`;
					}

					// Fallback to whichever is available
					return variantName || productName || "Unknown Product";
				};

				return {
					id: order.id,
					orderId: attributes.identifier,
					userEmail: attributes.user_email ?? "Unknown",
					userName: attributes.user_name,
					amount,
					status: attributes.status as "paid" | "refunded" | "pending",
					productName: getProductName(),
					purchaseDate: new Date(attributes.created_at),
					processor: this.id,
					discountCode: (attr.discount_code || null) as string | null,
					isFreeProduct: amount === 0,
					attributes,
				};
			});
		} catch (error) {
			if (error instanceof Error && error.message.includes("not properly configured")) {
				return [];
			}
			return this.handleError(error, "Error fetching Lemon Squeezy orders by email");
		}
	}

	/**
	 * Get a single order by ID
	 * @param orderId The order ID
	 * @returns The order if found, null otherwise
	 */
	async getOrderById(orderId: string): Promise<OrderData | null> {
		try {
			this.checkProviderReady();

			// LemonSqueezy SDK doesn't have a direct getOrderById method
			// So we'll get all orders and filter
			const orders = await this.getAllOrders();
			return orders.find((order) => order.orderId === orderId) ?? null;
		} catch (error) {
			if (error instanceof Error && error.message.includes("not properly configured")) {
				return null;
			}
			return this.handleError(error, "Error fetching Lemon Squeezy order by ID");
		}
	}

	/**
	 * Import payments from Lemon Squeezy
	 * @returns Statistics about the import process
	 */
	async importPayments(): Promise<ImportStats> {
		try {
			this.checkProviderReady();

			logger.debug("Starting Lemon Squeezy payment import");
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

			// Get all orders from Lemon Squeezy with timeout
			const ordersPromise = this.getAllOrders();
			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(() => {
					reject(new Error("Timeout getting orders from LemonSqueezy API"));
				}, 30 * 1000); // 30 seconds timeout
			});

			const lemonSqueezyOrders = await Promise.race([ordersPromise, timeoutPromise]);
			stats.total = lemonSqueezyOrders.length;
			logger.debug(`Found ${lemonSqueezyOrders.length} Lemon Squeezy orders`);

			if (lemonSqueezyOrders.length === 0) {
				logger.info("No LemonSqueezy orders found");
				return stats;
			}

			// Process orders in smaller batches to avoid overwhelming the database
			const BATCH_SIZE = 3; // Reduced batch size
			const MAX_CONCURRENT_BATCHES = 2; // Limit concurrent batches

			// Split orders into batches
			const batches: any[][] = [];
			for (let i = 0; i < lemonSqueezyOrders.length; i += BATCH_SIZE) {
				batches.push(lemonSqueezyOrders.slice(i, i + BATCH_SIZE));
			}

			// Process batches with concurrency limit
			for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
				const batchGroup = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
				const batchPromises = batchGroup.map(async (batch, batchIndex) => {
					const actualBatchIndex = i + batchIndex;
					logger.debug(
						`Processing batch ${actualBatchIndex + 1}/${batches.length} (${batch.length} orders)`
					);

					const batchStats = {
						imported: 0,
						skipped: 0,
						errors: 0,
						usersCreated: 0,
					};

					// Process each order in the batch sequentially to avoid race conditions
					for (const order of batch) {
						try {
							// Add timeout for each order processing
							const orderPromise = this.processOrder(order);
							const orderTimeoutPromise = new Promise<never>((_, reject) => {
								setTimeout(() => {
									reject(new Error(`Order processing timeout: ${order.orderId}`));
								}, 15 * 1000); // 15 seconds per order
							});

							const result = await Promise.race([orderPromise, orderTimeoutPromise]);

							if (result.action === "imported") {
								batchStats.imported++;
								if (result.userCreated) {
									batchStats.usersCreated++;
								}
							} else if (result.action === "skipped") {
								batchStats.skipped++;
							}
						} catch (error) {
							logger.error(`Error processing order ${order.orderId}`, { error });
							batchStats.errors++;
						}
					}

					return batchStats;
				});

				// Wait for current batch group to complete
				const batchResults = await Promise.all(batchPromises);

				// Aggregate results
				for (const batchResult of batchResults) {
					stats.imported += batchResult.imported;
					stats.skipped += batchResult.skipped;
					stats.errors += batchResult.errors;
					stats.usersCreated += batchResult.usersCreated;
				}
			}

			logger.info(`${this.name} payment import complete`, stats);
			return stats;
		} catch (error) {
			logger.error("Critical error during LemonSqueezy import", { error });
			return this.handleError(error, `Error importing ${this.name} payments`);
		}
	}

	/**
	 * Process a single order with proper error handling and database transaction
	 */
	private async processOrder(
		order: any
	): Promise<{ action: "imported" | "skipped"; userCreated?: boolean }> {
		// Validate order data
		if (!order.userEmail || order.userEmail === "Unknown") {
			logger.debug("Skipping order with no valid email", { orderId: order.orderId });
			return { action: "skipped" };
		}

		if (order.status !== "paid") {
			logger.debug("Skipping unpaid order", { orderId: order.orderId, status: order.status });
			return { action: "skipped" };
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		// Check if order already exists
		const existingPayment = await db
			.select({ id: payments.id })
			.from(payments)
			.where(eq(payments.orderId, order.orderId))
			.limit(1)
			.then((rows) => rows[0] || null);

		if (existingPayment) {
			logger.debug(`Order ${order.orderId} already exists`);
			return { action: "skipped" };
		}

		// Find or create user with better error handling
		let userId: string;
		let userCreated = false;

		try {
			const { user, created } = await userService.findOrCreateUserByEmail(
				order.userEmail.toLowerCase().trim(),
				{ name: order.userName ?? undefined }
			);

			userId = user.id;
			userCreated = created;

			if (created) {
				logger.debug("Created new user for LemonSqueezy order", {
					email: order.userEmail,
					orderId: order.orderId,
					userId: user.id,
				});
			}
		} catch (createError) {
			logger.error("Failed to find or create user for LemonSqueezy order", {
				email: order.userEmail,
				orderId: order.orderId,
				error: createError,
			});
			throw createError;
		}

		// Extract product information
		const orderAttributes = order.attributes;
		const firstOrderItem = orderAttributes.first_order_item;

		// Create payment metadata
		const paymentMetadata = {
			productName: firstOrderItem?.product_name || "Unknown Product",
			variantName: firstOrderItem?.variant_name || null,
			product_name: firstOrderItem?.product_name || "Unknown Product",
			variant_name: firstOrderItem?.variant_name || null,
			productId: firstOrderItem?.product_id || null,
			variantId: firstOrderItem?.variant_id || null,
			product_id: firstOrderItem?.product_id || null,
			variant_id: firstOrderItem?.variant_id || null,
			order_identifier: orderAttributes.identifier,
			order_number: orderAttributes.order_number,
			customer_id: orderAttributes.customer_id,
			currency: orderAttributes.currency,
			test_mode: orderAttributes.test_mode,
			custom_data: orderAttributes.custom_data,
		};

		// Create payment record
		await db.insert(payments).values({
			orderId: order.orderId,
			processorOrderId: order.id,
			userId,
			amount: Math.round(order.amount * 100), // Convert to cents
			status: "completed",
			processor: this.id,
			productName: firstOrderItem?.product_name || "Unknown Product",
			createdAt: order.purchaseDate,
			updatedAt: new Date(),
			metadata: JSON.stringify(paymentMetadata),
		});

		logger.debug(`Successfully imported LemonSqueezy order ${order.orderId}`);
		return { action: "imported", userCreated };
	}

	/**
	 * Handle a webhook event
	 * @param event The webhook event
	 */
	async handleWebhookEvent(event: any): Promise<void> {
		try {
			this.checkProviderReady();

			logger.debug(`Processing ${this.name} webhook`, { type: event?.type });

			// TODO: Implement webhook handling for Lemon Squeezy
			// Example implementation:
			// switch (event?.type) {
			//   case "order_created":
			//     // Handle order created
			//     break;
			//   case "subscription_created":
			//     // Handle subscription created
			//     break;
			//   // Add more cases as needed
			//   default:
			//     logger.debug(`Unknown ${this.name} webhook event type`, { type: event?.type });
			// }
		} catch (error) {
			this.handleError(error, `Error processing ${this.name} webhook`);
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

			// This is a placeholder implementation since LemonSqueezy SDK
			// doesn't have a direct checkout URL creation method in its types
			logger.debug(`Creating ${this.name} checkout URL`, { options });

			// TODO: Implement checkout URL creation for Lemon Squeezy

			// For now, return a generic URL with the product ID
			return `https://checkout.lemonsqueezy.com/buy/${options.productId}`;
		} catch (error) {
			if (error instanceof Error && error.message.includes("not properly configured")) {
				return null;
			}
			return this.handleError(error, `Error creating ${this.name} checkout URL`);
		}
	}

	/**
	 * List all products
	 * @returns Array of products
	 */
	async listProducts(): Promise<ProductData[]> {
		try {
			this.checkProviderReady();

			const response = await listProducts({});
			const products = response.data?.data ?? [];

			return products.map((product) => {
				const attributes = product.attributes as any;
				return {
					id: String(product.id),
					name: attributes.name,
					description: attributes.description,
					price: attributes.price_formatted
						? Number.parseFloat(attributes.price_formatted.replace(/[^0-9.]/g, ""))
						: undefined,
					isSubscription: attributes.is_subscription,
					provider: this.id,
					attributes: attributes,
				};
			});
		} catch (error) {
			if (error instanceof Error && error.message.includes("not properly configured")) {
				return [];
			}
			return this.handleError(error, `Error listing ${this.name} products`);
		}
	}
}

// Export a singleton instance
export const lemonSqueezyProvider = new LemonSqueezyProvider();
