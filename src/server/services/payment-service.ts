/**
 * @fileoverview Payment service for handling multi-provider payment operations
 * @module server/services/payment-service
 *
 * This service provides a unified interface for payment processing across multiple providers
 * (Lemon Squeezy, Stripe, Polar). It handles payment verification, order synchronization,
 * and user purchase tracking.
 *
 * Key responsibilities:
 * - Verify user purchases against payment provider APIs
 * - Synchronize payment data between providers and local database
 * - Check user purchase history and eligibility
 * - Import payment data from external providers
 * - Manage payment-related user permissions
 *
 * Dependencies:
 * - Payment providers: LemonSqueezy, Stripe, Polar (feature-flagged)
 * - Database: Drizzle ORM for payment records
 * - Logger: Structured logging for payment operations
 *
 * @security All payment verification uses provider APIs with proper authentication
 * @performance Caches payment data to reduce API calls
 */

import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { safeDbExecute } from "@/server/db";
import { type Payment, payments, users } from "@/server/db/schema";
import {
	getEnabledProviders,
	getProvider,
	hasProvider,
	isProviderEnabled,
	type OrderData,
	type ProductData,
} from "@/server/providers";

// Define PaymentData interface for frontend use
export interface PaymentData {
	id: string;
	orderId: string;
	userEmail: string;
	userName: string | null;
	userImage: string | null;
	amount: number;
	status: "paid" | "refunded" | "pending";
	productName: string;
	variantName?: string | null;
	purchaseDate: Date;
	processor: string;
	isFreeProduct: boolean;
	isInDatabase: boolean;
}

// Define interface for Purchase (used in user data)
export interface Purchase {
	id: string;
	productName: string;
	variantName?: string | null;
	amount: number;
	status: "paid" | "refunded" | "pending";
	purchaseDate: Date;
	orderId: string;
	processor?: string; // Payment processor (lemonsqueezy, polar, etc.)
	isFreeProduct: boolean;
}

// Define UserData interface for admin dashboard
export interface UserData {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
	role?: string;
	hasPaid: boolean;
	hasActiveSubscription: boolean;
	hadSubscription: boolean; // Tracks if user had a subscription in the past
	createdAt: Date;
	lastPurchaseDate: Date | null;
	totalPurchases: number;
	purchases?: Purchase[];
	providerStatuses?: Record<string, boolean>;
}

// Define ImportStats interface for payment imports
export interface ImportStats {
	total: number;
	imported: number;
	skipped: number;
	errors: number;
	usersCreated: number;
}

type ImportProvider = "lemonsqueezy" | "polar" | "all";

// Convert class to object with functions to satisfy linter
const PaymentService = {
	/**
	 * Gets the payment status for a user across all enabled providers
	 * @param userId - The ID of the user
	 * @returns Whether the user has paid
	 */
	async getUserPaymentStatus(userId: string): Promise<boolean> {
		logger.debug("Checking payment status", { userId });

		// Aggregate status across all enabled providers
		let status = false;
		const providers = getEnabledProviders();
		const providerStatuses: Record<string, boolean> = {};

		if (providers.length === 0) {
			logger.warn("No payment providers are enabled");
			return false;
		}

		// Check each provider in parallel
		const statusPromises = providers.map(async (provider) => {
			try {
				const providerStatus = await provider.getPaymentStatus(userId);
				providerStatuses[provider.id] = providerStatus;

				// If any provider returns true, the overall status is true
				if (providerStatus) {
					status = true;
				}

				return { provider: provider.id, status: providerStatus };
			} catch (error) {
				logger.error(`Error checking payment status with provider ${provider.id}`, {
					userId,
					error,
					provider: provider.id,
				});
				return { provider: provider.id, status: false, error };
			}
		});

		const results = await Promise.all(statusPromises);

		// For LemonSqueezy specifically, also check our configured products
		if (hasProvider("lemonsqueezy") && isProviderEnabled("lemonsqueezy")) {
			try {
				const { hasUserPurchasedAnyConfiguredProduct } = await import("@/lib/lemonsqueezy/lemonsqueezy");
				const hasConfiguredProducts = await hasUserPurchasedAnyConfiguredProduct(userId);
				if (hasConfiguredProducts) {
					status = true;
					logger.debug("User has purchased configured LemonSqueezy products", { userId });
				}
			} catch (error) {
				logger.error("Error checking configured LemonSqueezy products", { userId, error });
			}
		}

		logger.debug("Payment status results", {
			userId,
			status,
			providerStatuses: results,
		});

		return status;
	},

	/**
	 * Checks if a user has purchased a specific variant (for Lemon Squeezy)
	 * @param userId The user ID
	 * @param variantId The variant ID/UUID
	 * @param provider Optional payment provider to check
	 * @returns True if the user has purchased the variant
	 */
	async hasUserPurchasedVariant({
		userId,
		variantId,
		provider,
	}: {
		userId: string;
		variantId: string;
		provider?: string;
	}): Promise<boolean> {
		try {
			// Use safeDbExecute to handle database unavailability
			const hasDbPurchase = await safeDbExecute(async (db) => {
				// Check if the user exists
				const user = await db
					.select()
					.from(users)
					.where(eq(users.id, userId))
					.limit(1)
					.then((rows: any[]) => rows[0] || null);

				if (!user) {
					return false;
				}

				// Check for specific variant purchases in the database
				const userPayments = await db.select().from(payments).where(eq(payments.userId, userId));

				// Check if any payment metadata contains the variant ID
				return userPayments.some((payment: any) => {
					try {
						const metadata = JSON.parse(payment.metadata || "{}");
						// Check various ways the variant might be identified
						// Use String() conversion to handle number vs string comparison
						const variantIdStr = String(variantId);
						return (
							String(metadata.variant_id) === variantIdStr ||
							String(metadata.variantId) === variantIdStr ||
							// Also check if the variant ID is in the checkout URL or custom data
							JSON.stringify(metadata).includes(variantIdStr)
						);
					} catch {
						return false;
					}
				});
			}, false);

			if (hasDbPurchase) {
				return true;
			}

			// If provider is specified, only check that provider
			if (provider && hasProvider(provider)) {
				const paymentProvider = getProvider(provider);
				if (paymentProvider && isProviderEnabled(provider)) {
					logger.debug(`Checking variant purchase with specific provider: ${provider}`);
					// Check if the provider has a specific method for variants
					if (typeof (paymentProvider as any).hasUserPurchasedVariant === "function") {
						return await (paymentProvider as any).hasUserPurchasedVariant(userId, variantId);
					}
					// Fall back to product check
					return await paymentProvider.hasUserPurchasedProduct(userId, variantId);
				}
				return false;
			}

			// Otherwise, check all enabled providers
			const providers = getEnabledProviders();
			for (const provider of providers) {
				logger.debug(`Checking variant purchase with provider: ${provider.id}`);

				// Check if the provider has a specific method for variants
				if (typeof (provider as any).hasUserPurchasedVariant === "function") {
					const purchased = await (provider as any).hasUserPurchasedVariant(userId, variantId);
					if (purchased) {
						logger.debug(`User ${userId} has purchased variant ${variantId} via ${provider.id}`);
						return true;
					}
				} else {
					// Fall back to product check
					const purchased = await provider.hasUserPurchasedProduct(userId, variantId);
					if (purchased) {
						logger.debug(`User ${userId} has purchased variant ${variantId} via ${provider.id}`);
						return true;
					}
				}
			}

			logger.debug(`User ${userId} has NOT purchased variant ${variantId} via any provider`);
			return false;
		} catch (error) {
			logger.error("Error checking if user purchased variant:", error);
			return false;
		}
	},

	/**
	 * Checks if a user has purchased a specific product
	 * @param userId The user ID
	 * @param productId The product ID
	 * @param provider Optional payment provider to check
	 * @returns True if the user has purchased the product
	 */
	async hasUserPurchasedProduct({
		userId,
		productId,
		provider,
	}: {
		userId: string;
		productId: string;
		provider?: string;
	}): Promise<boolean> {
		try {
			// Use safeDbExecute to handle database unavailability
			const hasDbPurchase = await safeDbExecute(async (db) => {
				// Check if the user exists
				const user = await db
					.select()
					.from(users)
					.where(eq(users.id, userId))
					.limit(1)
					.then((rows: any[]) => rows[0] || null);

				if (!user) {
					return false;
				}

				// Check for specific product purchases in the database
				// This would require additional metadata parsing
				const userPayments = await db.select().from(payments).where(eq(payments.userId, userId));

				// Check if any payment metadata contains the product ID
				return userPayments.some((payment: any) => {
					try {
						const metadata = JSON.parse(payment.metadata || "{}");
						// Check various ways the product might be identified
						// Use String() conversion to handle number vs string comparison
						const productIdStr = String(productId);
						return (
							String(metadata.productId) === productIdStr ||
							String(metadata.variant_id) === productIdStr ||
							String(metadata.product_id) === productIdStr ||
							metadata.productName?.includes(productIdStr) ||
							metadata.variant_name?.includes(productIdStr) ||
							metadata.product_name?.includes(productIdStr)
						);
					} catch {
						return false;
					}
				});
			}, false);

			if (hasDbPurchase) {
				return true;
			}

			// If provider is specified, only check that provider
			if (provider && hasProvider(provider)) {
				const paymentProvider = getProvider(provider);
				if (paymentProvider && isProviderEnabled(provider)) {
					logger.debug(`Checking purchase with specific provider: ${provider}`);
					return await paymentProvider.hasUserPurchasedProduct(userId, productId);
				}
				return false;
			}

			// Otherwise, check all enabled providers
			const providers = getEnabledProviders();
			for (const provider of providers) {
				logger.debug(`Checking purchase with provider: ${provider.id}`);
				const purchased = await provider.hasUserPurchasedProduct(userId, productId);
				if (purchased) {
					logger.debug(`User ${userId} has purchased product ${productId} via ${provider.id}`);
					return true;
				}
			}

			logger.debug(`User ${userId} has NOT purchased product ${productId} via any provider`);
			return false;
		} catch (error) {
			logger.error("Error checking if user purchased product:", error);
			return false;
		}
	},

	/**
	 * Checks if a user has an active subscription
	 * @param userId The user ID
	 * @param provider Optional payment provider to check
	 * @returns True if the user has an active subscription
	 */
	async hasUserActiveSubscription({
		userId,
		provider,
	}: {
		userId: string;
		provider?: string;
	}): Promise<boolean> {
		try {
			// Use safeDbExecute to handle database unavailability
			const hasDbSubscription = await safeDbExecute(async (db) => {
				// Check if the user exists
				const user = await db
					.select()
					.from(users)
					.where(eq(users.id, userId))
					.limit(1)
					.then((rows: any[]) => rows[0] || null);

				if (!user) {
					return false;
				}

				// For subscriptions, we rely more on the payment provider APIs
				// since subscription status can change frequently
				return false;
			}, false);

			// If provider is specified, only check that provider
			if (provider && hasProvider(provider)) {
				const paymentProvider = getProvider(provider);
				if (paymentProvider && isProviderEnabled(provider)) {
					return await paymentProvider.hasUserActiveSubscription(userId);
				}
				return false;
			}

			// Otherwise, check all enabled providers
			const providers = getEnabledProviders();
			for (const provider of providers) {
				const hasActiveSubscription = await provider.hasUserActiveSubscription(userId);
				if (hasActiveSubscription) {
					return true;
				}
			}

			return hasDbSubscription;
		} catch (error) {
			logger.error("Error checking if user has active subscription:", error);
			return false;
		}
	},

	/**
	 * Gets all products a user has purchased
	 * @param userId The user ID
	 * @param provider Optional payment provider to check
	 * @returns Array of purchased products
	 */
	async getUserPurchasedProducts(userId: string, provider?: string): Promise<ProductData[]> {
		try {
			// Use safeDbExecute to handle database unavailability
			const dbProducts = await safeDbExecute(async (db) => {
				// Check if the user exists
				const user = await db
					.select()
					.from(users)
					.where(eq(users.id, userId))
					.limit(1)
					.then((rows: any[]) => rows[0] || null);

				if (!user) {
					return [];
				}

				// Get user payments to extract product information
				const userPayments = await db.select().from(payments).where(eq(payments.userId, userId));

				// Extract unique products from payment metadata
				const dbProductsMap = new Map<string, ProductData>();

				for (const payment of userPayments) {
					try {
						const metadata = JSON.parse(payment.metadata || "{}");
						const productId =
							metadata.productId || metadata.variant_id || metadata.product_id || payment.orderId;

						// Enhanced product name extraction from multiple possible fields
						const productName =
							metadata.productName ||
							metadata.variant_name ||
							metadata.product_name ||
							"Unknown Product";

						if (productId && !dbProductsMap.has(productId)) {
							dbProductsMap.set(productId, {
								id: productId,
								name: productName,
								price: (payment.amount || 0) / 100,
								description: metadata.description || "",
								provider: payment.processor || "unknown",
								// Add other fields as needed
							});
						}
					} catch {
						// Skip invalid metadata
					}
				}

				return Array.from(dbProductsMap.values());
			}, []);

			// If provider is specified, only check that provider
			if (provider && hasProvider(provider)) {
				const paymentProvider = getProvider(provider);
				if (paymentProvider && isProviderEnabled(provider)) {
					const providerProducts = await paymentProvider.getUserPurchasedProducts(userId);
					// Merge with database products
					return [...dbProducts, ...providerProducts];
				}
				return dbProducts;
			}

			// Otherwise, get products from all enabled providers
			const providers = getEnabledProviders();
			const productPromises = providers.map((provider) =>
				provider.getUserPurchasedProducts(userId).catch((error) => {
					logger.error(`Error getting products from provider ${provider.id}:`, error);
					return [];
				})
			);

			const providerProducts = await Promise.all(productPromises);

			// Merge products from all sources
			const allProducts = [...dbProducts, ...providerProducts.flat()];

			return allProducts;
		} catch (error) {
			logger.error("Error getting user purchased products:", error);
			return [];
		}
	},

	/**
	 * Gets all payments for a user
	 * @param userId - The ID of the user
	 * @returns Array of payments
	 */
	async getUserPayments(userId: string): Promise<Payment[]> {
		logger.debug("Fetching user payments", { userId });

		return safeDbExecute(async (db) => {
			const userPayments = await db
				.select()
				.from(payments)
				.where(eq(payments.userId, userId))
				.orderBy(payments.createdAt);

			logger.debug("User payments fetched", {
				userId,
				count: userPayments.length,
				totalAmount: userPayments.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
			});

			return userPayments;
		}, []);
	},

	/**
	 * Creates a new payment in the database
	 * @param data Payment data to create
	 * @returns The created payment or null if database unavailable
	 */
	async createPayment(data: {
		userId: string;
		orderId: string;
		amount: number;
		status: string;
		processor?: string;
		isFreeProduct?: boolean;
		metadata?: Record<string, unknown>;
	}): Promise<Payment | null> {
		try {
			return await safeDbExecute(async (db) => {
				// Check if the payment already exists
				const existingPayment = await db
					.select()
					.from(payments)
					.where(eq(payments.orderId, data.orderId))
					.limit(1)
					.then((rows: any[]) => rows[0] || null);

				if (existingPayment) {
					logger.debug("Payment already exists", { orderId: data.orderId });
					return existingPayment;
				}

				// Create new payment
				const newPayment = await db
					.insert(payments)
					.values({
						userId: data.userId,
						orderId: data.orderId,
						processorOrderId: data.orderId, // Store same value for consistency
						amount: data.amount,
						status: data.status,
						processor: data.processor || "unknown",
						isFreeProduct: data.isFreeProduct || false,
						metadata: JSON.stringify(data.metadata || {}),
						createdAt: new Date(),
						updatedAt: new Date(),
					})
					.returning()
					.then((rows: any[]) => rows[0] || null);

				logger.info("Payment created", {
					paymentId: newPayment?.id,
					orderId: data.orderId,
					userId: data.userId,
					amount: data.amount,
					status: data.status,
					processor: data.processor,
				});

				return newPayment;
			}, null);
		} catch (error) {
			logger.error("Error creating payment", { error, orderId: data.orderId });
			throw error;
		}
	},

	/**
	 * Updates a payment's status
	 * @param orderId - The order ID
	 * @param status - The new status
	 * @returns The updated payment or null if not found or database unavailable
	 */
	async updatePaymentStatus(orderId: string, status: string): Promise<Payment | null> {
		logger.debug("Updating payment status", { orderId, status });

		return safeDbExecute(async (db) => {
			const [payment] = await db
				.update(payments)
				.set({ status, updatedAt: new Date() })
				.where(eq(payments.orderId, orderId))
				.returning();

			if (!payment) {
				logger.error("Payment not found for status update", { orderId, status });
				return null;
			}

			logger.debug("Payment status updated", {
				paymentId: payment.id,
				orderId,
				oldStatus: payment.status,
				newStatus: status,
				processor: payment.processor,
			});

			return payment;
		}, null);
	},

	/**
	 * Gets a payment by order ID
	 * @param orderId - The order ID
	 * @returns The payment if found
	 */
	async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
		logger.debug("Fetching payment by order ID", { orderId });

		return safeDbExecute(async (db) => {
			return await db
				.select()
				.from(payments)
				.where(eq(payments.orderId, orderId))
				.limit(1)
				.then((rows) => rows[0] || null);
		}, null);
	},

	/**
	 * Gets all payments with user information for admin dashboard
	 * This fetches from the database AND all configured payment providers,
	 * merging the results and indicating which records exist in the database.
	 * @returns Array of payment data with user information
	 */
	async getPaymentsWithUsers(): Promise<PaymentData[]> {
		const combinedPayments = new Map<string, PaymentData>();
		let allUsers: (typeof users.$inferSelect)[] = [];

		try {
			// Use safeDbExecute to handle database unavailability
			const dbPaymentsData = await safeDbExecute(async (db) => {
				// Get all users from the database
				allUsers = await db.select().from(users);

				// Get all payments from the database
				const dbPayments = await db.select().from(payments);
				logger.debug(`Fetched ${dbPayments.length} payments from database.`);

				// Process database payments
				const dbPaymentsMap = new Map<string, PaymentData>();

				for (const payment of dbPayments) {
					const user = allUsers.find((u) => u.id === payment.userId);
					let productName = "Unknown Product";
					let variantName: string | null = null;
					let isFreeProduct = payment.isFreeProduct || false;

					// First check if productName is stored directly in the database
					if (payment.productName) {
						productName = payment.productName;
					} else {
						// Fallback to metadata extraction for legacy payments
						try {
							if (payment.metadata) {
								const metadata = JSON.parse(payment.metadata);

								// Enhanced product name extraction from multiple possible fields
								productName =
									metadata.productName ||
									metadata.product_name ||
									metadata.variant_name ||
									"Unknown Product";

								// Extract variant name separately
								variantName = metadata.variantName || metadata.variant_name || null;

								if (metadata.isFreeProduct !== undefined) {
									isFreeProduct = metadata.isFreeProduct;
								}
							}
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : String(error);
							logger.warn(`Failed to parse metadata for DB payment ID: ${payment.id}`, {
								error: errorMessage,
							});
						}
					}

					const processorOrderId = payment.processorOrderId || payment.orderId;
					if (!processorOrderId) {
						logger.warn(`Skipping DB payment ID ${payment.id} due to missing order identifier.`);
						continue;
					}

					const compositeKey = `${payment.processor || "unknown"}:${processorOrderId}`;

					dbPaymentsMap.set(compositeKey, {
						id: payment.id.toString(),
						orderId: processorOrderId,
						userEmail: user?.email || "unknown@example.com",
						userName: user?.name || null,
						userImage: user?.image || null,
						amount: (payment.amount || 0) / 100,
						status: payment.status as "paid" | "refunded" | "pending",
						productName,
						variantName,
						purchaseDate: payment.purchasedAt || new Date(payment.createdAt),
						processor: payment.processor || "unknown",
						isFreeProduct,
						isInDatabase: true,
					});
				}

				return dbPaymentsMap;
			}, new Map<string, PaymentData>());

			// Copy database payments to the combined map
			for (const [key, value] of dbPaymentsData) {
				combinedPayments.set(key, value);
			}

			// Get payments from all enabled providers
			const providers = getEnabledProviders();
			logger.debug(`Fetching payments from ${providers.length} enabled providers.`);

			for (const provider of providers) {
				try {
					const apiOrders: OrderData[] = await provider.getAllOrders();
					logger.debug(`Fetched ${apiOrders.length} orders from provider: ${provider.id}`);

					for (const order of apiOrders) {
						if (!order.orderId) {
							logger.warn(
								`Skipping API order from ${provider.id} with internal ID ${order.id} due to missing order identifier.`
							);
							continue;
						}

						const compositeKey = `${provider.id}:${order.orderId}`;
						const existingEntry = combinedPayments.get(compositeKey);

						if (existingEntry) {
							// Update existing DB entry with potentially fresher API data
							if (existingEntry.isInDatabase) {
								existingEntry.status = order.status;
								existingEntry.amount = order.amount;
								existingEntry.productName = order.productName || existingEntry.productName;
								// Try to extract variant name from order attributes if available
								if ((order as any).attributes) {
									const orderAttributes = (order as any).attributes;
									const variantName =
										orderAttributes.first_order_item?.variant_name ||
										orderAttributes.variant_name ||
										null;
									if (variantName && !existingEntry.variantName) {
										existingEntry.variantName = variantName;
									}
								}
								/*
								 * Handle free vs discounted products correctly:
								 * - Free products: Never went through payment processing
								 * - Discounted products: Went through payment processing with 100% discount
								 *
								 * Users with 100% discounts should be treated as paid customers since they
								 * completed the checkout process, even if the final amount was $0.
								 */
								existingEntry.isFreeProduct =
									(order as any).isFreeProduct !== undefined
										? (order as any).isFreeProduct
										: order.status !== "paid" && order.amount === 0;
							}
						} else {
							// Add new entry from API (not found in DB)
							const user = allUsers.find(
								(u) => u.email?.toLowerCase() === order.userEmail?.toLowerCase()
							);
							/*
							 * Handle free vs discounted products correctly:
							 * - Free products: Never went through payment processing
							 * - Discounted products: Went through payment processing with 100% discount
							 *
							 * Users with 100% discounts should be treated as paid customers since they
							 * completed the checkout process, even if the final amount was $0.
							 */
							const isFreeProduct =
								(order as any).isFreeProduct !== undefined
									? (order as any).isFreeProduct
									: order.status !== "paid" && order.amount === 0;

							// Try to extract variant name from order attributes if available
							let variantName: string | null = null;
							if ((order as any).attributes) {
								const orderAttributes = (order as any).attributes;
								variantName =
									orderAttributes.first_order_item?.variant_name ||
									orderAttributes.variant_name ||
									null;
							}

							combinedPayments.set(compositeKey, {
								id: order.id,
								orderId: order.orderId,
								userEmail: order.userEmail || "unknown@example.com",
								userName: order.userName || user?.name || null,
								userImage: user?.image || null,
								amount: order.amount,
								status: order.status,
								productName: order.productName || "Unknown Product",
								variantName,
								purchaseDate: order.purchaseDate,
								processor: provider.id,
								isFreeProduct,
								isInDatabase: false,
							});
						}
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					logger.error(`Error fetching or processing orders from provider ${provider.id}`, {
						error: errorMessage,
					});
				}
			}

			// Convert map values to array and sort
			const finalPaymentData = Array.from(combinedPayments.values()).sort((a, b) => {
				const dateA = a.purchaseDate instanceof Date ? a.purchaseDate.getTime() : 0;
				const dateB = b.purchaseDate instanceof Date ? b.purchaseDate.getTime() : 0;
				return dateB - dateA;
			});

			logger.info(`Returning ${finalPaymentData.length} combined payments.`);
			return finalPaymentData;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error("Error getting combined payments with users:", { error: errorMessage });

			const partialData = Array.from(combinedPayments.values()).sort((a, b) => {
				const dateA = a.purchaseDate instanceof Date ? a.purchaseDate.getTime() : 0;
				const dateB = b.purchaseDate instanceof Date ? b.purchaseDate.getTime() : 0;
				return dateB - dateA;
			});
			logger.warn(`Returning ${partialData.length} partial payments due to error.`);
			return partialData.length > 0 ? partialData : [];
		}
	},

	/**
	 * Fetches all users with their payment status from all payment providers
	 * This is used in the admin dashboard to display user payment information
	 * @returns Array of users with payment information
	 */
	async getUsersWithPayments(): Promise<UserData[]> {
		try {
			return await safeDbExecute(async (db) => {
				// Get all users
				const allUsers = await db.select().from(users);

				// Get all payments
				const allPayments = await db.select().from(payments);

				// Map users to UserData format
				const userData: UserData[] = [];

				for (const user of allUsers) {
					// Get payments for this user
					const userPayments = allPayments.filter((payment) => payment.userId === user.id);

					// Sort payments by date (newest first)
					userPayments.sort((a: any, b: any) => {
						return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
					});

					// Map payments to Purchase format
					const purchases: Purchase[] = userPayments.map((payment: any) => {
						let productName = "Unknown Product";
						let variantName: string | null = null;

						// First check if productName is stored directly in the database
						if (payment.productName) {
							productName = payment.productName;
						} else {
							// Fallback to metadata extraction for legacy payments
							try {
								if (payment.metadata) {
									const metadata = JSON.parse(payment.metadata as string);

									// Enhanced product name extraction from multiple possible fields
									productName =
										metadata.productName ||
										metadata.product_name ||
										metadata.variant_name ||
										"Unknown Product";

									// Extract variant name separately
									variantName = metadata.variantName || metadata.variant_name || null;
								}
							} catch (error) {
								// Ignore parsing errors
							}
						}

						return {
							id: String(payment.id),
							productName,
							variantName,
							amount: (payment.amount ?? 0) / 100,
							status: payment.status as "paid" | "refunded" | "pending",
							purchaseDate: new Date(payment.createdAt),
							orderId: payment.orderId || payment.processorOrderId || "",
							processor: payment.processor || "unknown",
							isFreeProduct: payment.isFreeProduct || false,
						};
					});

					// Check payment status from all payment providers
					const providers = getEnabledProviders();
					const providerStatuses: Record<string, boolean> = {};
					let hasPaid = false;
					let hasActiveSubscription = false;

					// Check each provider in parallel
					const statusPromises = providers.map(async (provider) => {
						try {
							const paymentStatus = await provider.getPaymentStatus(user.id);
							const subscriptionStatus = await provider.hasUserActiveSubscription(user.id);

							providerStatuses[provider.id] = paymentStatus;

							if (paymentStatus) {
								hasPaid = true;
							}

							if (subscriptionStatus) {
								hasActiveSubscription = true;
							}

							return {
								provider: provider.id,
								paymentStatus,
								subscriptionStatus,
							};
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : String(error);
							logger.error(`Error checking ${provider.name} payment status:`, {
								userId: user.id,
								error: errorMessage,
							});
							return {
								provider: provider.id,
								paymentStatus: false,
								subscriptionStatus: false,
								error: errorMessage,
							};
						}
					});

					await Promise.all(statusPromises);

					const hadSubscription = user.metadata
						? JSON.parse(user.metadata)?.hadSubscription || false
						: false;

					// Get the last purchase date
					const lastPurchaseDate =
						userPayments.length > 0 && userPayments[0]?.createdAt ? new Date(userPayments[0].createdAt) : null;

					// Create user data object
					userData.push({
						id: user.id,
						email: user.email || "",
						name: user.name,
						image: user.image,
						role: user.role,
						hasPaid,
						hasActiveSubscription,
						hadSubscription,
						createdAt: new Date(user.createdAt),
						lastPurchaseDate,
						totalPurchases: userPayments.length,
						purchases,
						providerStatuses,
					});
				}

				return userData;
			}, []);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error("Error getting users with payments:", { error: errorMessage });
			return [];
		}
	},

	/**
	 * Imports payments from all providers into the database
	 * @returns Stats about the import process for each provider
	 */
	async importAllPayments(): Promise<Record<string, any>> {
		logger.info("Starting import of all payments");

		const providers = getEnabledProviders();
		const results: Record<string, any> = {};

		if (providers.length === 0) {
			logger.warn("No payment providers are enabled");
			return results;
		}

		// Import payments from each provider with timeout and error handling
		const importPromises = providers.map(async (provider) => {
			const providerResult = {
				provider: provider.id,
				stats: null as any,
				error: null as string | null,
				duration: 0,
			};

			const startTime = Date.now();

			try {
				logger.info(`Starting payment import for ${provider.name}`);

				// Add timeout to prevent hanging
				const importPromise = provider.importPayments();
				const timeoutPromise = new Promise<never>((_, reject) => {
					setTimeout(
						() => {
							reject(new Error(`Import timeout after 5 minutes for ${provider.name}`));
						},
						5 * 60 * 1000
					); // 5 minutes timeout
				});

				const stats = await Promise.race([importPromise, timeoutPromise]);
				providerResult.stats = stats;
				providerResult.duration = Date.now() - startTime;

				logger.info(`Completed payment import for ${provider.name}`, {
					stats,
					duration: providerResult.duration,
				});

				return providerResult;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				providerResult.error = errorMessage;
				providerResult.duration = Date.now() - startTime;

				logger.error(`Error during ${provider.name} import`, {
					error: errorMessage,
					duration: providerResult.duration,
				});

				return providerResult;
			}
		});

		// Wait for all imports to complete (or timeout)
		const allResults = await Promise.all(importPromises);

		// Format results for response
		for (const result of allResults) {
			if (result.error) {
				results[result.provider] = {
					error: result.error,
					duration: result.duration,
				};
			} else {
				results[result.provider] = {
					...result.stats,
					duration: result.duration,
				};
			}
		}

		logger.info("All payment imports complete", { results });
		return results;
	},

	/**
	 * Creates a checkout URL for a product
	 * @param options Checkout options
	 * @param providerId The ID of the provider to use
	 * @returns The checkout URL
	 */
	async createCheckoutUrl(
		options: {
			productId: string;
			email?: string;
			userId?: string;
			metadata?: Record<string, any>;
			successUrl?: string;
			cancelUrl?: string;
		},
		providerId: string
	): Promise<string | null> {
		try {
			const provider = getProvider(providerId);

			if (!provider || !isProviderEnabled(providerId)) {
				logger.error(`Provider ${providerId} not found or not enabled`);
				return null;
			}

			return await provider.createCheckoutUrl(options);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error(`Error creating checkout URL with provider ${providerId}:`, {
				error: errorMessage,
			});
			return null;
		}
	},

	/**
	 * Gets all available providers
	 * @returns Array of provider information
	 */
	getProviders(): { id: string; name: string; enabled: boolean }[] {
		const allProviderData = getEnabledProviders().map((provider) => ({
			id: provider.id,
			name: provider.name,
			enabled: provider.isEnabled,
		}));
		return allProviderData;
	},
};

export { PaymentService };
