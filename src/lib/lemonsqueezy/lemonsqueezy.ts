import { lemonSqueezySetup, listOrders, listProducts } from "@lemonsqueezy/lemonsqueezy.js";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { logger } from "@/lib/logger";
// src/config/lemonsqueezy.ts
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import type { LemonSqueezyOrderAttributes } from "@/types/lemonsqueezy";

export interface PaymentData {
	id: string;
	orderId: string;
	userEmail: string;
	userName: string | null;
	amount: number;
	status: "paid" | "refunded" | "pending";
	productName: string;
	purchaseDate: Date;
	isFreeProduct: boolean; // Distinguishes free products from discounted products
}

// Configuration
const configureLemonSqueezy = (): void => {
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED || !env?.LEMONSQUEEZY_API_KEY) {
		return;
	}
	lemonSqueezySetup({ apiKey: env.LEMONSQUEEZY_API_KEY });
};

// Initialize on import
configureLemonSqueezy();

/**
 * Fetches orders for a specific email from Lemon Squeezy
 */
export const getOrdersByEmail = async (email: string) => {
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		logger.warn("Attempted to get LS orders by email, but feature is disabled.");
		return [];
	}
	try {
		configureLemonSqueezy();

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

		// Map the orders to include enhanced product information
		return response.data.data.map((order) => {
			const attributes = order.attributes as LemonSqueezyOrderAttributes;

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

			// Add enhanced product information to the order
			return {
				...order,
				attributes: {
					...attributes,
					enhanced_product_name: getProductName(),
				},
			};
		});
	} catch (error) {
		console.error("Error fetching orders by email:", error);
		return [];
	}
};

/**
 * Fetches all orders from Lemon Squeezy
 */
export const getAllOrders = async () => {
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		logger.warn("Attempted to get all orders, but feature is disabled.");
		return [];
	}
	try {
		configureLemonSqueezy();

		// Include order-items in the response to get detailed product information
		const response = await listOrders({
			include: ["order-items", "customer"],
		});

		if (!response || !Array.isArray(response.data?.data)) {
			return [];
		}

		return response.data.data.map((order) => {
			const attributes = order.attributes as LemonSqueezyOrderAttributes;

			// Use subtotal as the amount field since total is often returning 0
			const amount = attributes.subtotal > 0 ? attributes.subtotal / 100 : 0;

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

			// Determine if this is a free product vs discounted to $0
			const isFreeProduct = amount === 0 && attributes.subtotal === 0;

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

			return {
				id: order.id,
				orderId: attributes.identifier,
				userEmail: attributes.user_email ?? "Unknown",
				userName: attributes.user_name,
				// Include additional user fields if available
				userAddress: attr.user_address || null,
				userCity: attr.user_city || null,
				userCountry: attr.user_country || null,
				userPhone: attr.user_phone || null,
				// Include any custom user properties
				customUserData,
				amount,
				status: attributes.status as "paid" | "refunded" | "pending",
				productName: getProductName(),
				purchaseDate: new Date(attributes.created_at),
				// Include discount code if available - use type assertion to avoid TypeScript error
				discountCode: (attr.discount_code || null) as string | null,
				isFreeProduct, // Add this field to distinguish free vs discounted products
				attributes,
			};
		});
	} catch (error) {
		logger.error("Error fetching all orders:", error);
		return [];
	}
};

/**
 * Gets the payment status for a user by checking both their ID and email
 * This ensures we catch payments even if they used a different email
 */
export const getLemonSqueezyPaymentStatus = async (userId: string): Promise<boolean> => {
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		logger.warn("Attempted to get LS payment status, but feature is disabled.");
		return false;
	}
	try {
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!user?.email) return false;

		// Check Lemon Squeezy orders by both user ID and email
		const orders = await listOrders({});
		const userOrders =
			orders.data?.data?.filter((order) => {
				const attributes = order.attributes as LemonSqueezyOrderAttributes;
				const customData = attributes.custom_data || {};

				// Check if either the user ID matches or the email matches
				return (
					// Match by user ID in custom data
					(typeof customData === "object" && customData?.user_id === userId) ||
					// Or match by email (case insensitive)
					attributes.user_email?.toLowerCase() === user.email.toLowerCase()
				);
			}) ?? [];

		const hasPaid = userOrders.some(
			(order) => (order.attributes as LemonSqueezyOrderAttributes).status === "paid"
		);

		return hasPaid;
	} catch (error) {
		console.error("Error checking payment status:", error);
		return false;
	}
};

export const fetchLemonSqueezyProducts = async () => {
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		logger.warn("Attempted to fetch LS products, but feature is disabled.");
		return [];
	}
	const response = await listProducts({});
	return response.data ?? [];
};

/**
 * Fetches product variants from Lemon Squeezy
 * Variants are what customers actually purchase and checkout with
 */
export const fetchLemonSqueezyVariants = async () => {
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		logger.warn("Attempted to fetch LS variants, but feature is disabled.");
		return [];
	}
	try {
		// Import listVariants from the SDK
		const { listVariants } = await import("@lemonsqueezy/lemonsqueezy.js");
		const response = await listVariants({});
		return response.data ?? [];
	} catch (error) {
		logger.error("Error fetching LemonSqueezy variants:", error);
		return [];
	}
};

/**
 * Fetches configured products with their variants for display
 * This combines product data with the specific variants configured in site config
 */
export const fetchConfiguredLemonSqueezyProducts = async () => {
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		logger.warn("Attempted to fetch configured LS products, but feature is disabled.");
		return [];
	}

	try {
		// Import site config to get configured variant IDs
		const { siteConfig } = await import("@/config/site-config");

		// Fetch all variants
		const variants = await fetchLemonSqueezyVariants();
		if (!Array.isArray(variants)) {
			return [];
		}

		// Filter to only include variants that are configured in our site config
		const configuredVariantIds = Object.values(siteConfig.store.products);

		const configuredProducts = variants
			.filter((variant: any) => configuredVariantIds.includes(variant.id))
			.map((variant: any) => {
				// Find the product key for this variant
				const productKey = Object.keys(siteConfig.store.products).find(
					(key) => siteConfig.store.products[key] === variant.id
				);

				return {
					id: variant.id, // This is the variant ID used for checkout
					productKey,
					attributes: {
						...variant.attributes,
					},
				};
			});

		logger.debug(`Fetched ${configuredProducts.length} configured products`);
		return configuredProducts;
	} catch (error) {
		logger.error("Error fetching configured LemonSqueezy products:", error);
		return [];
	}
};

/**
 * Checks if a user has purchased a specific product by variant ID
 */
export const hasUserPurchasedProduct = async (
	userId: string,
	variantId: string | number
): Promise<boolean> => {
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		logger.warn("Attempted to check LS product purchase, but feature is disabled.");
		return false;
	}
	try {
		logger.debug("Checking if user has purchased product", { userId, variantId });

		// First get the user email
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!user?.email) return false;

		// Get user orders
		const orders = await listOrders({});
		const userOrders =
			orders.data?.data?.filter((order) => {
				const attributes = order.attributes as LemonSqueezyOrderAttributes;
				const customData = attributes.custom_data || {};

				// Check if either the user ID matches or the email matches
				return (
					(typeof customData === "object" && customData?.user_id === userId) ||
					attributes.user_email?.toLowerCase() === user.email.toLowerCase()
				);
			}) ?? [];

		// Check if any paid order includes the specific variant ID
		const hasPurchased = userOrders.some((order) => {
			const attributes = order.attributes as LemonSqueezyOrderAttributes;

			// Check if order is paid and contains the product variant
			return (
				attributes.status === "paid" &&
				attributes.first_order_item?.variant_id === Number(variantId)
			);
		});

		logger.debug("User product purchase check result", {
			userId,
			variantId,
			hasPurchased,
			orderCount: userOrders.length,
		});

		return hasPurchased;
	} catch (error) {
		logger.error("Error checking if user purchased product:", error);
		return false;
	}
};

/**
 * Checks if a user has an active subscription
 */
export const hasUserActiveSubscription = async (userId: string): Promise<boolean> => {
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		logger.warn("Attempted to check LS subscription, but feature is disabled.");
		return false;
	}
	try {
		logger.debug("Checking if user has active subscription", { userId });

		// First get the user email
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!user?.email) return false;

		// Get user subscriptions
		try {
			// We need to use the Lemon Squeezy SDK to get subscriptions
			// Type assertion here since the SDK types may not be complete
			const lemonClient = lemonSqueezySetup({
				apiKey: env.LEMONSQUEEZY_API_KEY ?? "",
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
						attributes.user_email?.toLowerCase() === user.email.toLowerCase()
					);
				}) ?? [];

			// Check if any subscription is active
			const hasActiveSubscription = userSubscriptions.some((subscription: any) => {
				const attributes = subscription.attributes;
				return attributes.status === "active";
			});

			logger.debug("User subscription check result", {
				userId,
				hasActiveSubscription,
				subscriptionCount: userSubscriptions.length,
			});

			return hasActiveSubscription;
		} catch (error) {
			logger.error("Error checking user subscriptions:", error);
			return false;
		}
	} catch (error) {
		logger.error("Error checking if user has active subscription:", error);
		return false;
	}
};

/**
 * Gets all products that a user has purchased
 */
export const getUserPurchasedProducts = async (userId: string): Promise<any[]> => {
	try {
		logger.debug("Getting user purchased products", { userId });

		// First get the user email
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!user?.email) return [];

		// Get user orders
		const orders = await listOrders({});
		const userOrders =
			orders.data?.data?.filter((order) => {
				const attributes = order.attributes as LemonSqueezyOrderAttributes;
				const customData = attributes.custom_data || {};

				// Check if either the user ID matches or the email matches
				return (
					(typeof customData === "object" && customData?.user_id === userId) ||
					attributes.user_email?.toLowerCase() === user.email.toLowerCase()
				);
			}) ?? [];

		// Extract unique products from paid orders
		const purchasedVariantIds = new Set<number>();
		const purchasedProducts: any[] = [];

		// Use for...of loop instead of forEach
		for (const order of userOrders) {
			const attributes = order.attributes as LemonSqueezyOrderAttributes;

			// Only consider paid orders
			if (attributes.status === "paid" && attributes.first_order_item) {
				const variantId = attributes.first_order_item.variant_id;

				// Only add each variant once
				if (!purchasedVariantIds.has(variantId)) {
					purchasedVariantIds.add(variantId);
					purchasedProducts.push({
						id: attributes.first_order_item.product_id,
						variant_id: variantId,
						name: attributes.first_order_item.product_name,
						variant_name: attributes.first_order_item.variant_name,
						price: attributes.first_order_item.price,
						purchaseDate: new Date(attributes.created_at),
					});
				}
			}
		}

		logger.debug("User purchased products", {
			userId,
			productCount: purchasedProducts.length,
		});

		return purchasedProducts;
	} catch (error) {
		logger.error("Error getting user purchased products:", error);
		return [];
	}
};

/**
 * Gets the configured variant ID for a product key from site config
 * @param productKey The product key (e.g., 'shipkit', 'bones', etc.)
 * @returns The variant ID or null if not found
 */
export const getVariantIdForProduct = async (productKey: string): Promise<string | null> => {
	try {
		const { siteConfig } = await import("@/config/site-config");
		return siteConfig.store.products[productKey] || null;
	} catch (error) {
		logger.error("Error getting variant ID for product:", error);
		return null;
	}
};

/**
 * Gets all configured variant IDs from site config
 * @returns Array of configured variant IDs
 */
export const getConfiguredVariantIds = async (): Promise<string[]> => {
	try {
		const { siteConfig } = await import("@/config/site-config");
		return Object.values(siteConfig.store.products);
	} catch (error) {
		logger.error("Error getting configured variant IDs:", error);
		return [];
	}
};

/**
 * Gets the product key for a given variant ID
 * @param variantId The variant ID to look up
 * @returns The product key or null if not found
 */
export const getProductKeyForVariant = async (variantId: string): Promise<string | null> => {
	try {
		const { siteConfig } = await import("@/config/site-config");
		const productKey = Object.keys(siteConfig.store.products).find(
			(key) => siteConfig.store.products[key] === variantId
		);
		return productKey || null;
	} catch (error) {
		logger.error("Error getting product key for variant:", error);
		return null;
	}
};

/**
 * Checks if a user has purchased any of our configured products
 * This is the main function to use for checking if a user has paid
 */
export const hasUserPurchasedAnyConfiguredProduct = async (userId: string): Promise<boolean> => {
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		logger.warn("Attempted to check configured product purchases, but feature is disabled.");
		return false;
	}

	try {
		// Get all configured variant IDs
		const configuredVariantIds = await getConfiguredVariantIds();

		// Check if user has purchased any of these variants
		for (const variantId of configuredVariantIds) {
			const hasPurchased = await hasUserPurchasedProduct(userId, variantId);
			if (hasPurchased) {
				logger.debug(`User ${userId} has purchased variant ${variantId}`);
				return true;
			}
		}

		logger.debug(`User ${userId} has not purchased any configured products`);
		return false;
	} catch (error) {
		logger.error("Error checking if user purchased any configured product:", error);
		return false;
	}
};

/**
 * Gets all products a user has purchased from our configured products
 * @param userId The user ID
 * @returns Array of product keys the user has purchased
 */
export const getUserPurchasedConfiguredProducts = async (userId: string): Promise<string[]> => {
	if (!env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		logger.warn("Attempted to get user's configured product purchases, but feature is disabled.");
		return [];
	}

	try {
		// Get all configured variant IDs
		const configuredVariantIds = await getConfiguredVariantIds();
		const purchasedProducts: string[] = [];

		// Check each configured variant
		for (const variantId of configuredVariantIds) {
			const hasPurchased = await hasUserPurchasedProduct(userId, variantId);
			if (hasPurchased) {
				const productKey = await getProductKeyForVariant(variantId);
				if (productKey) {
					purchasedProducts.push(productKey);
				}
			}
		}

		logger.debug(`User ${userId} has purchased products: [${purchasedProducts.join(", ")}]`);
		return purchasedProducts;
	} catch (error) {
		logger.error("Error getting user's purchased configured products:", error);
		return [];
	}
};
