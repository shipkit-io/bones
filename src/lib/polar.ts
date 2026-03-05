import { Polar } from "@polar-sh/sdk";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { payments, users } from "@/server/db/schema";

// Define interfaces for Polar types
export interface PolarPaymentData {
	id: string;
	orderId: string;
	userEmail: string;
	userName: string | null;
	amount: number;
	status: "paid" | "refunded" | "pending";
	productName: string;
	purchaseDate: Date;
}

// Helper type for Polar orders
interface PolarOrder {
	id: string;
	orderId: string;
	userEmail: string;
	userName: string | null;
	amount: number;
	status: "paid" | "refunded" | "pending";
	productName: string;
	purchaseDate: Date;
	discountCode: string | null;
	attributes: Record<string, any>;
}

// Add this type definition for subscription attributes
export interface PolarOrderAttributes {
	product?: {
		id: string;
		name: string;
	};
	isSubscription?: boolean;
	is_recurring?: boolean;
	subscription_status?: string;
	subscription_end_date?: string | Date; // ISO string or Date object
	expiresAt?: string | Date; // Alternative field name for expiration
}

/**
 * Initialize Polar API client
 * This will be called whenever the Polar API is used to ensure the API key is set
 */
const initializePolarClient = (): Polar | null => {
	if (!env?.POLAR_ACCESS_TOKEN) {
		logger.error("POLAR_ACCESS_TOKEN is not set in the environment.");
		return null;
	}

	// Initialize the Polar client
	try {
		const polarClient = new Polar({
			accessToken: env.POLAR_ACCESS_TOKEN,
			// Use sandbox for development, production for production
			server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
		});

		logger.debug("Polar client initialized");
		return polarClient;
	} catch (error) {
		logger.error("Failed to initialize Polar client:", error);
		return null;
	}
};

/**
 * Fetches orders for a specific email from Polar
 */
export const getOrdersByEmail = async (email: string): Promise<PolarOrder[]> => {
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		logger.debug("Polar feature is disabled. Skipping getOrdersByEmail.");
		return [];
	}
	try {
		const polarClient = initializePolarClient();
		if (!polarClient) {
			return [];
		}

		logger.debug("Fetching Polar orders by email", { email });

		// Call the Polar API to fetch orders by email with expanded product information
		// Request product and variant details to extract proper product names
		const response = await polarClient.orders.list({
			include: ["product", "product.variants", "items", "items.product", "items.variant"],
		} as any);

		// Extract orders from the response
		const orders = extractOrdersFromResponse(response);

		// Filter orders by email
		const userOrders = orders.filter(
			(order) => order.customer?.email?.toLowerCase() === email.toLowerCase()
		);

		// Transform the Polar orders to our PolarOrder interface
		return userOrders.map((order) => mapToPolarOrder(order));
	} catch (error) {
		logger.warn("Error fetching Polar orders by email:", error);
		return [];
	}
};

/**
 * Fetches all orders from Polar
 */
export const getAllOrders = async (): Promise<PolarOrder[]> => {
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		logger.debug("Polar feature is disabled. Skipping getAllOrders.");
		return [];
	}
	try {
		const polarClient = initializePolarClient();
		if (!polarClient) {
			return [];
		}

		logger.debug("Fetching all Polar orders");

		// Call the Polar API to fetch all orders with expanded product information
		// Request product and variant details to extract proper product names
		const response = await polarClient.orders.list({
			include: ["product", "product.variants", "items", "items.product", "items.variant"],
		} as any);

		// Log the raw response for debugging (only in development)
		if (process.env.NODE_ENV === "development") {
			logger.debug("Raw Polar API response:", { response: JSON.stringify(response, null, 2) });
		}

		// Extract orders from the response
		const orders = extractOrdersFromResponse(response);

		// Log the first extracted order (if any) to see its structure (only in development)
		if (orders.length > 0 && process.env.NODE_ENV === "development") {
			logger.debug("First extracted Polar order structure:", {
				firstOrder: JSON.stringify(orders[0], null, 2),
			});
		}

		// Transform the Polar orders to our PolarOrder interface
		return orders.map((order) => mapToPolarOrder(order));
	} catch (error) {
		logger.error("Error fetching all Polar orders:", error);
		return [];
	}
};

/**
 * Helper function to extract orders from various response formats
 */
const extractOrdersFromResponse = (response: any): any[] => {
	if (!response) return [];

	// Try different response formats
	if (Array.isArray(response)) {
		return response;
	}

	if (response.items && Array.isArray(response.items)) {
		return response.items;
	}

	if (response.data?.items && Array.isArray(response.data.items)) {
		return response.data.items;
	}

	if (response.result?.items && Array.isArray(response.result.items)) {
		return response.result.items;
	}

	// If we can't find orders in the expected formats, log and return empty array
	logger.debug("Unknown Polar orders response format", { response });
	return [];
};

/**
 * Convert any price format to integer cents
 * Handles: integer cents, float dollars, string representations
 */
const convertPriceToIntegerCents = (price: any): number => {
	if (price === null || price === undefined) return 0;

	// If it's already an integer, assume it's already in cents
	if (Number.isInteger(price)) return price;

	// If it's a number but not an integer, assume it's in dollars and convert to cents
	if (typeof price === "number") {
		return Math.round(price * 100);
	}

	// If it's a string, parse it and convert to cents
	if (typeof price === "string") {
		const parsedPrice = Number.parseFloat(price);
		if (!Number.isNaN(parsedPrice)) {
			return Math.round(parsedPrice * 100);
		}
	}

	// If we can't determine the format, log a warning and return 0
	logger.warn("Unable to parse price value, defaulting to 0", { price });
	return 0;
};

/**
 * Map a Polar order object to our PolarOrder interface
 */
const mapToPolarOrder = (order: any): PolarOrder => {
	// Extract amount from order, handling different possible formats
	let amount = 0;
	if (order.amount !== undefined) {
		// If amount is provided directly
		amount = convertPriceToIntegerCents(order.amount);
	} else if (order.totalAmount !== undefined) {
		// Try totalAmount if amount is not available
		amount = convertPriceToIntegerCents(order.totalAmount);
	} else if (order.total) {
		// Try total if totalAmount is not available
		amount = convertPriceToIntegerCents(order.total);
	}

	// Extract subscription-related information
	const isSubscription = !!(
		order.isSubscription ||
		order.is_recurring ||
		order.subscriptionId ||
		order.subscription_id ||
		(order.subscription_status && order.subscription_status !== "canceled") ||
		(order.attributes?.subscription_status && order.attributes.subscription_status !== "canceled")
	);

	// Log subscription detection
	// if (isSubscription) {
	// 	logger.debug("Detected subscription in order", {
	// 		orderId: order.id,
	// 		isSubscription,
	// 		subscriptionStatus: order.subscription_status || order.attributes?.subscription_status,
	// 		subscriptionEndDate:
	// 			order.subscription_end_date ||
	// 			order.expiresAt ||
	// 			order.attributes?.subscription_end_date ||
	// 			order.attributes?.expiresAt,
	// 	});
	// }

	// Convert amount from cents to dollars
	amount = amount / 100;

	// Generate a unique ID for the order if one doesn't exist
	const id = order.id || `polar-${order.orderId || Date.now()}`;

	// Extract order ID with fallbacks
	const orderId = order.orderId || order.order_id || order.id || `polar-${Date.now()}`;

	// Extract user email and name with fallbacks
	const userEmail = order.customer?.email || order.email || order.userEmail || "Unknown email";

	const userName = order.customer?.name || order.customer?.displayName || order.userName || null;

	// Extract product name with enhanced fallback hierarchy
	// Priority: product.name > variant.name > productName > description > "Unknown Product"
	let productName = "Unknown Product";

	if (order.product?.name) {
		productName = order.product.name;
		logger.debug("Product name extracted from order.product.name", { orderId, productName });
	} else if (order.variant?.name) {
		productName = order.variant.name;
		logger.debug("Product name extracted from order.variant.name", { orderId, productName });
	} else if (order.productName) {
		productName = order.productName;
		logger.debug("Product name extracted from order.productName", { orderId, productName });
	} else if (order.description) {
		productName = order.description;
		logger.debug("Product name extracted from order.description", { orderId, productName });
	} else if (order.items && Array.isArray(order.items) && order.items.length > 0) {
		// Check if order has items array with product information
		const firstItem = order.items[0];
		if (firstItem.product?.name) {
			productName = firstItem.product.name;
			logger.debug("Product name extracted from order.items[0].product.name", {
				orderId,
				productName,
			});
		} else if (firstItem.variant?.name) {
			productName = firstItem.variant.name;
			logger.debug("Product name extracted from order.items[0].variant.name", {
				orderId,
				productName,
			});
		} else if (firstItem.name) {
			productName = firstItem.name;
			logger.debug("Product name extracted from order.items[0].name", { orderId, productName });
		}
	}

	// Log if we fell back to "Unknown Product"
	if (productName === "Unknown Product") {
		logger.warn("Could not extract product name, using fallback", {
			orderId,
			availableFields: {
				hasProduct: !!order.product,
				productName: order.product?.name,
				hasVariant: !!order.variant,
				variantName: order.variant?.name,
				orderProductName: order.productName,
				description: order.description,
				hasItems: !!(order.items && Array.isArray(order.items) && order.items.length > 0),
				firstItemStructure: order.items?.[0] ? Object.keys(order.items[0]) : null,
			},
		});
	}

	// Extract purchase date
	const purchaseDate = order.created_at || order.createdAt || order.date || new Date();

	// Extract discount code
	const discountCode = order.discount_code || order.discountCode || order.coupon || null;

	// Extract status with fallbacks or defaults
	const rawStatus = order.status || order.orderStatus || "pending";
	const status = mapPolarOrderStatus(rawStatus);

	// Extract subscription end date with fallbacks
	const subscriptionEndDate =
		order.subscription_end_date ||
		order.expiresAt ||
		order.attributes?.subscription_end_date ||
		order.attributes?.expiresAt;

	// Return mapped order with enhanced subscription data
	return {
		id,
		orderId,
		userEmail,
		userName,
		amount,
		status,
		productName,
		purchaseDate: new Date(purchaseDate),
		discountCode,
		attributes: {
			...order,
			// Enhance attributes with subscription information
			isSubscription,
			is_recurring: isSubscription || order.is_recurring,
			subscription_status: order.subscription_status || order.attributes?.subscription_status,
			subscription_end_date: subscriptionEndDate,
		},
	};
};

/**
 * Helper function to map Polar order status to our simplified status
 */
const mapPolarOrderStatus = (status: string | undefined): "paid" | "refunded" | "pending" => {
	if (!status) return "pending";

	switch (status.toLowerCase()) {
		case "paid":
		case "succeeded":
		case "completed":
			return "paid";
		case "refunded":
			return "refunded";
		default:
			return "pending";
	}
};

/**
 * Gets the payment status for a user by checking both their ID and email
 */
export const getPolarPaymentStatus = async (userId: string): Promise<boolean> => {
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		logger.debug("Polar feature is disabled. Skipping getPolarPaymentStatus.");
		return false;
	}

	logger.debug("Checking Polar payment status for user", { userId });

	try {
		const polarClient = initializePolarClient();
		if (!polarClient) {
			return false;
		}

		// First check the database for existing payment records
		const payment = await db?.query.payments.findFirst({
			where: eq(payments.userId, userId),
			// Only look for Polar payments
			columns: {
				id: true,
				processor: true,
				status: true,
			},
		});

		// If we have a payment record with Polar as the processor, return true
		if (payment && payment.processor === "polar" && payment.status === "completed") {
			return true;
		}

		// If not found in the database, get the user's email
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				email: true,
			},
		});

		if (!user?.email) return false;

		// Check Polar orders by email
		const orders = await getOrdersByEmail(user.email);
		const hasPaid = orders.some((order) => order.status === "paid");

		// Removed database insertion to avoid foreign key constraint violation

		return hasPaid;
	} catch (error) {
		logger.error("Error checking Polar payment status:", error);
		return false;
	}
};

/**
 * Fetch products from Polar
 */
export const fetchPolarProducts = async () => {
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		logger.debug("Polar feature is disabled. Skipping fetchPolarProducts.");
		return [];
	}
	try {
		const polarClient = initializePolarClient();
		if (!polarClient) {
			return [];
		}

		logger.debug("Fetching Polar products");

		// Call the Polar API to fetch products
		// Using a more generic approach to handle potential SDK differences
		const response = await polarClient.products.list({} as any);

		// Extract products from the response
		const products = extractProductsFromResponse(response);

		// Filter out archived products
		return products.filter((product) => !product.isArchived);
	} catch (error) {
		logger.error("Error fetching Polar products:", error);
		return [];
	}
};

/**
 * Helper function to extract products from various response formats
 */
const extractProductsFromResponse = (response: any): any[] => {
	if (!response) return [];

	// Try different response formats
	if (Array.isArray(response)) {
		return response;
	}

	if (response.items && Array.isArray(response.items)) {
		return response.items;
	}

	if (response.data?.items && Array.isArray(response.data.items)) {
		return response.data.items;
	}

	if (response.result?.items && Array.isArray(response.result.items)) {
		return response.result.items;
	}

	// If we can't find products in the expected formats, log and return empty array
	logger.debug("Unknown Polar products response format", { response });
	return [];
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (orderId: string): Promise<PolarOrder | null> => {
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		logger.debug("Polar feature is disabled. Skipping getOrderById.");
		return null;
	}
	try {
		const polarClient = initializePolarClient();
		if (!polarClient) {
			return null;
		}

		logger.debug("Fetching Polar order by ID", { orderId });

		// Call the Polar API to fetch an order by ID
		const response = await polarClient.orders.get({
			id: orderId,
		});

		// Extract order from response
		const order = response as any;

		if (!order?.id) {
			return null;
		}

		// Transform the Polar order to our PolarOrder interface
		return mapToPolarOrder(order);
	} catch (error) {
		logger.error("Error fetching Polar order by ID:", error);
		return null;
	}
};

/**
 * Process a webhook event from Polar
 */
export const processPolarWebhook = async (event: any) => {
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		logger.warn("Received Polar webhook, but Polar feature is disabled. Skipping processing.", {
			eventType: event?.type,
		});
		return; // Or return a specific response indicating disabled feature
	}

	logger.info("Processing Polar webhook event", { type: event?.type });

	try {
		const polarClient = initializePolarClient();
		if (!polarClient) {
			return;
		}

		logger.debug("Processing Polar webhook", { eventType: event?.type });

		// TODO: Implement webhook handling based on the Polar documentation
		// Handle different event types (checkout.updated, subscription.created, etc.)
		// Update database records as needed

		switch (event?.type) {
			case "checkout.created":
				// Handle checkout created
				break;
			case "checkout.updated":
				if (event.data.status === "succeeded") {
					// Convert amount to integer cents
					const amountInCents = convertPriceToIntegerCents(event.data.amount);

					// Create payment record
					// Similar to:
					// await PaymentService.createPayment({
					//   userId: event.data.custom_data?.user_id,
					//   orderId: event.data.id,
					//   amount: amountInCents,
					//   status: "completed",
					//   processor: "polar",
					//   metadata: event.data,
					// });
				}
				break;
			case "subscription.created":
			case "subscription.updated":
			case "subscription.active":
			case "subscription.revoked":
			case "subscription.canceled":
				// Handle subscription events
				break;
			default:
				logger.debug("Unknown Polar webhook event type", { type: event?.type });
		}
	} catch (error) {
		logger.error("Error processing Polar webhook:", error);
	}
};

/**
 * Create a checkout URL for a product
 */
export const createCheckoutUrl = async (options: {
	productId: string;
	email?: string;
	userId?: string;
	metadata?: Record<string, any>;
}): Promise<string | null> => {
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		logger.debug("Polar feature is disabled. Skipping createCheckoutUrl.");
		return null;
	}
	try {
		const polarClient = initializePolarClient();
		if (!polarClient) {
			return null;
		}

		logger.debug("Creating Polar checkout URL", { options });

		// Create a checkout session with type assertion to handle potential SDK differences
		const response = await polarClient.checkouts.create({
			productId: options.productId,
			customerEmail: options.email,
			metadata: options.metadata || {},
		} as any);

		// Extract URL from response
		const url = extractCheckoutUrl(response, options.productId);

		if (!url) {
			logger.error("Failed to create Polar checkout URL", { options, response });
			return null;
		}

		return url;
	} catch (error) {
		logger.error("Error creating Polar checkout URL:", error);
		return null;
	}
};

/**
 * Helper function to extract checkout URL from various response formats
 */
const extractCheckoutUrl = (response: any, productId: string): string | null => {
	if (!response) return null;

	// Try different response formats
	if (typeof response === "string") {
		return response;
	}

	if (response.url) {
		return response.url;
	}

	if (response.data?.url) {
		return response.data.url;
	}

	// Fallback to a generated URL if we can't find it in the response
	logger.debug("Unknown Polar checkout response format, using fallback URL", { response });
	return `https://checkout.polar.sh/checkout?product=${productId}`;
};

/**
 * Checks if a user has purchased a specific Polar product
 * @param userId User ID to check
 * @param productId Polar product ID to check
 * @returns True if the user has purchased the product
 */
export const hasUserPurchasedProduct = async (
	userId: string,
	productId: string
): Promise<boolean> => {
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		logger.debug("Polar feature is disabled. Skipping hasUserPurchasedProduct.");
		return false;
	}
	logger.debug("Checking if user purchased product", { userId, productId });
	try {
		// Check if the user has any payment
		const hasPayment = await getPolarPaymentStatus(userId);
		if (!hasPayment) {
			return false;
		}

		// First get the user email
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				email: true,
			},
		});

		if (!user?.email) return false;

		// Get user orders
		const orders = await getOrdersByEmail(user.email);

		// Check if any order contains the product with exact matching
		return orders.some(
			(order) => order.status === "paid" && order.attributes?.product?.id === productId
		);
	} catch (error) {
		logger.error("Error checking if user purchased Polar product:", error);
		return false;
	}
};

/**
 * Checks if a user has an active subscription with Polar
 * @param userId User ID to check
 * @returns True if the user has an active subscription
 */
export const hasUserActiveSubscription = async (userId: string): Promise<boolean> => {
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		logger.debug("Polar feature is disabled. Skipping hasUserActiveSubscription.");
		return false;
	}

	logger.debug("Checking for active Polar subscription for user", { userId });

	try {
		// Check if the user has any payment
		const hasPayment = await getPolarPaymentStatus(userId);
		if (!hasPayment) {
			logger.debug("No Polar payment found for user", { userId });
			return false;
		}

		// First get the user email
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

		// Get user orders
		const orders = await getOrdersByEmail(user.email);
		logger.debug("Found orders for user", { userId, email: user.email, orderCount: orders.length });

		// Get current date for subscription expiration comparison
		const now = new Date();

		// Check if any order is a subscription and is active
		const hasActiveSubscription = orders.some((order) => {
			const attr = order.attributes;

			// Basic subscription indicators
			const isSubscriptionType = !!(
				attr.isSubscription ||
				attr.is_recurring ||
				attr.subscriptionId ||
				attr.subscription_id
			);

			// Status indicators
			const hasActiveStatus = !!(
				attr.subscription_status === "active" || attr.subscription_status === "trialing"
			);

			// Combined check for subscription status
			const isActive = order.status === "paid" && (isSubscriptionType || hasActiveStatus);

			// Date validation when applicable
			if (isActive) {
				// Check expiration date if available
				const endDate = attr.subscription_end_date || attr.expiresAt;

				if (endDate) {
					const expirationDate = new Date(endDate);
					const isNotExpired = expirationDate > now;

					logger.debug("Subscription expiration check", {
						orderId: order.id,
						isActive,
						expirationDate: expirationDate.toISOString(),
						now: now.toISOString(),
						isNotExpired,
					});

					return isNotExpired;
				}

				// If no expiration date but status is active, consider valid
				logger.debug("Active subscription without expiration date", {
					orderId: order.id,
					isActive,
					status: order.status,
					subscriptionStatus: attr.subscription_status,
				});
				return true;
			}

			return false;
		});

		logger.debug("Polar subscription check result", {
			userId,
			email: user.email,
			hasActiveSubscription,
		});

		return hasActiveSubscription;
	} catch (error) {
		logger.error("Error checking if user has active Polar subscription:", error);
		return false;
	}
};

/**
 * Gets all products a user has purchased from Polar
 * @param userId User ID to check
 * @returns Array of purchased products
 */
export const getUserPurchasedProducts = async (userId: string): Promise<any[]> => {
	if (!env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		logger.debug("Polar feature is disabled. Skipping getUserPurchasedProducts.");
		return [];
	}

	logger.debug("Fetching user purchased Polar products", { userId });

	try {
		// Check if the user has any payment
		const hasPayment = await getPolarPaymentStatus(userId);
		if (!hasPayment) {
			return [];
		}

		// First get the user email
		const user = await db?.query.users.findFirst({
			where: eq(users.id, userId),
			columns: {
				email: true,
			},
		});

		if (!user?.email) return [];

		// Get user orders
		const orders = await getOrdersByEmail(user.email);

		// Extract unique products from paid orders
		const purchasedProductIds = new Set<string>();
		const purchasedProducts: any[] = [];

		// Process each order
		for (const order of orders) {
			// Only consider paid orders
			if (order.status === "paid") {
				const productId = order.attributes?.product?.id || "";

				// Only add each product once
				if (productId && !purchasedProductIds.has(productId)) {
					purchasedProductIds.add(productId);
					purchasedProducts.push({
						id: productId,
						name: order.productName,
						orderId: order.id,
						purchaseDate: order.purchaseDate,
						provider: "polar",
					});
				}
			}
		}

		return purchasedProducts;
	} catch (error) {
		logger.error("Error getting user purchased Polar products:", error);
		return [];
	}
};
