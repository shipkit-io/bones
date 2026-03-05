/**
 * Common interfaces and types for payment providers
 */

/**
 * Basic order data interface that all providers should map to
 */
export interface OrderData {
	id: string;
	orderId: string;
	userEmail: string;
	userName: string | null;
	amount: number;
	status: "paid" | "refunded" | "pending";
	productName: string;
	purchaseDate: Date;
	processor: string;
	discountCode?: string | null;
	isFreeProduct?: boolean;
	attributes?: Record<string, any>;
}

/**
 * Product information returned by providers
 */
export interface ProductData {
	id: string;
	name: string;
	price?: number;
	description?: string;
	isSubscription?: boolean;
	provider: string;
	attributes?: Record<string, any>;
}

/**
 * Statistics returned when importing payments
 */
export interface ImportStats {
	total: number;
	imported: number;
	skipped: number;
	errors: number;
	usersCreated: number;
}

/**
 * Options for creating a checkout URL
 */
export interface CheckoutOptions {
	productId: string;
	email?: string;
	userId?: string;
	metadata?: Record<string, any>;
	successUrl?: string;
	cancelUrl?: string;
}

/**
 * Provider configuration options
 */
export interface ProviderConfig {
	apiKey?: string;
	webhookSecret?: string;
	enabled?: boolean;
	sandbox?: boolean;
	baseUrl?: string;
	options?: Record<string, any>;
}

/**
 * Interface that all payment providers must implement
 */
export interface PaymentProvider {
	// Provider identity
	readonly name: string;
	readonly id: string;

	// Provider status
	readonly isEnabled: boolean;
	readonly isConfigured: boolean;

	// Core functionality
	getPaymentStatus(userId: string): Promise<boolean>;
	hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean>;
	hasUserActiveSubscription(userId: string): Promise<boolean>;
	getUserPurchasedProducts(userId: string): Promise<ProductData[]>;
	getAllOrders(): Promise<OrderData[]>;
	getOrdersByEmail(email: string): Promise<OrderData[]>;
	getOrderById(orderId: string): Promise<OrderData | null>;

	// Import functionality
	importPayments(): Promise<ImportStats>;

	// Webhook handling
	handleWebhookEvent(event: any): Promise<void>;

	// Product/checkout functionality
	createCheckoutUrl(options: CheckoutOptions): Promise<string | null>;
	listProducts(): Promise<ProductData[]>;

	// Configuration
	initialize(config: ProviderConfig): void;
}

/**
 * Error class for payment provider errors
 */
export class PaymentProviderError extends Error {
	constructor(
		message: string,
		public readonly provider: string,
		public readonly code?: string,
		public readonly originalError?: Error
	) {
		super(message);
		this.name = "PaymentProviderError";
	}
}
