/**
 * Check if the value is an object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/**
 * Typeguard to check if the object has a 'meta' property
 * and that the 'meta' property has the correct shape.
 */
export interface LemonSqueezyWebhookMeta {
	meta: {
		test_mode: boolean;
	};
}

export function webhookHasMeta(data: any): data is LemonSqueezyWebhookMeta {
	return data && typeof data === "object" && "meta" in data;
}

/**
 * Lemon Squeezy API Types and Interfaces
 *
 * Key Concepts:
 * - Products: Main items in your store (e.g., "Shipkit Pro")
 * - Variants: Specific pricing/billing versions of products (e.g., "Shipkit Pro - Monthly")
 * - Orders: Customer purchases
 *
 * For checkout and payment verification, always use Variant IDs, not Product IDs.
 */

/**
 * Product variant data from Lemon Squeezy API
 * This is what customers actually purchase
 */
export interface LemonSqueezyVariant {
	id: string; // Variant ID (UUID) - used for checkout
	attributes: {
		name: string;
		description: string;
		price_formatted: string;
		price: number; // in cents
		is_subscription: boolean;
		interval?: string; // for subscriptions
		interval_count?: number;
		created_at: string;
		updated_at: string;
	};
}

/**
 * Product data from Lemon Squeezy API
 * Products contain multiple variants
 */
export interface LemonSqueezyProduct {
	id: string; // Product ID (UUID) - NOT used for checkout
	attributes: {
		name: string;
		description: string;
		price_formatted?: string; // May not be present on products
		buy_now_url?: string; // Generic buy URL - prefer variant-specific URLs
		created_at: string;
		updated_at: string;
	};
}

/**
 * Configured product for display with proper checkout URL
 * This combines variant data with our site configuration
 */
export interface ConfiguredLemonSqueezyProduct {
	id: string; // Variant ID (for checkout)
	productKey?: string; // Key from site config (e.g., 'shipkit', 'bones')
	attributes: {
		name: string;
		description: string;
		price_formatted: string;
		buy_now_url: string; // Generated from site config with correct variant ID
		is_subscription?: boolean;
		interval?: string;
		interval_count?: number;
	};
}

/**
 * Type for Lemon Squeezy order attributes
 */
export interface LemonSqueezyOrderAttributes {
	store_id: number;
	identifier: string;
	order_number: number;
	user_name: string | null;
	user_email: string | null;
	currency: string;
	currency_rate: string;
	subtotal: number;
	discount_total: number;
	tax: number;
	total: number;
	subtotal_usd: number;
	discount_total_usd: number;
	tax_usd: number;
	total_usd: number;
	tax_name: string | null;
	tax_rate: string | null;
	status: string;
	status_formatted: string;
	refunded: boolean;
	refunded_at: string | null;
	subtotal_formatted: string;
	discount_total_formatted: string;
	tax_formatted: string;
	total_formatted: string;
	first_order_item: {
		id: number;
		order_id: number;
		product_id: number; // Numeric product ID
		variant_id: number; // Numeric variant ID
		product_name: string;
		variant_name: string;
		price: number;
		created_at: string;
		updated_at: string;
	};
	urls: {
		receipt: string;
	};
	created_at: string;
	updated_at: string;
	test_mode: boolean;
	custom_data?: Record<string, unknown>;
}

/**
 * Webhook payload structure
 */
export interface LemonSqueezyWebhookPayload {
	meta: {
		event_name: string;
		custom_data?: Record<string, unknown>;
		test_mode: boolean;
	};
	data: {
		type: string;
		id: string;
		attributes: LemonSqueezyOrderAttributes;
	};
}

/**
 * Payment verification result
 */
export interface PaymentVerificationResult {
	success: boolean;
	purchased: boolean;
	message?: string;
	variantId?: string;
	productKey?: string;
}

/**
 * Product key type - these are the keys defined in site config
 */
export type ProductKey = "shipkit" | "bones" | "brains";

/**
 * Variant ID type - UUID strings from Lemon Squeezy
 */
export type VariantId = string;

/**
 * User purchase summary
 */
export interface UserPurchaseSummary {
	userId: string;
	hasPaidAnyProduct: boolean;
	purchasedProducts: ProductKey[];
	purchasedVariants: VariantId[];
	totalPurchases: number;
	lastPurchaseDate?: Date;
}

/**
 * Configuration for Lemon Squeezy integration
 */
export interface LemonSqueezyConfig {
	apiKey: string;
	storeId: string;
	webhookSecret: string;
	enabled: boolean;
	testMode?: boolean;
}

/**
 * Checkout options for creating payment links
 */
export interface LemonSqueezyCheckoutOptions {
	variantId: VariantId; // Required: Variant to purchase
	email?: string; // Pre-fill customer email
	userId?: string; // Track user for webhook processing
	customData?: Record<string, unknown>; // Additional data for webhook
	successUrl?: string; // Redirect after successful payment
	cancelUrl?: string; // Redirect after cancelled payment
	dark?: boolean; // Use dark theme
}

/**
 * Payment metadata stored in database
 */
export interface LemonSqueezyPaymentMetadata {
	order_identifier: string;
	order_number: number;
	customer_id?: number;
	product_id: number; // Numeric product ID from API
	variant_id: number; // Numeric variant ID from API
	product_name: string;
	variant_name: string;
	currency: string;
	test_mode: boolean;
	custom_data?: Record<string, unknown>;
	webhook_event: string;
}

/**
 * Typeguard to check if the object has a 'data' property and the correct shape.
 *
 * @param obj - The object to check.
 * @returns True if the object has a 'data' property.
 */
export function webhookHasData(obj: unknown): obj is {
	data: {
		attributes: LemonSqueezyOrderAttributes & {
			first_subscription_item: {
				id: number;
				price_id: number;
				is_usage_based: boolean;
			};
		};
		id: string;
	};
} {
	return isObject(obj) && "data" in obj && isObject(obj.data) && "attributes" in obj.data;
}
