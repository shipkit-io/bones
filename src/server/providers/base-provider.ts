import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { db, schema } from "@/server/db";
import { users } from "@/server/db/schema";
import {
	type CheckoutOptions,
	type ImportStats,
	type OrderData,
	type PaymentProvider,
	PaymentProviderError,
	type ProductData,
	type ProviderConfig,
} from "./types";

/**
 * Abstract base class for payment providers
 * Implements common functionality and provides a base for provider-specific implementations
 */
export abstract class BasePaymentProvider implements PaymentProvider {
	// Provider identity
	abstract readonly name: string;
	abstract readonly id: string;

	// Provider status
	protected _isConfigured = false;
	protected _isEnabled = false;
	protected _config: ProviderConfig = {};

	get isConfigured(): boolean {
		return this._isConfigured;
	}

	get isEnabled(): boolean {
		return this._isEnabled && this._isConfigured;
	}

	/**
	 * Initialize the provider with configuration
	 * @param config Provider configuration
	 */
	initialize(config: ProviderConfig): void {
		this._config = config;
		this._isEnabled = config.enabled ?? true;
		this.validateConfig();

		// logger.debug(`Initialized payment provider: ${this.name}`, {
		// 	provider: this.id,
		// 	isEnabled: this.isEnabled,
		// 	isConfigured: this.isConfigured,
		// 	sandbox: config.sandbox ?? false,
		// });
	}

	/**
	 * Validate the provider configuration
	 * Should be implemented by each provider to check for required fields
	 */
	protected abstract validateConfig(): void;

	/**
	 * Handle common provider errors
	 * @param error The error to handle
	 * @param message Optional message to include
	 * @param code Optional error code
	 */
	protected handleError(error: unknown, message = "Payment provider error", code?: string): never {
		let errorMessage = message;

		if (error instanceof Error) {
			errorMessage = `${message}: ${error.message}`;
			logger.error(errorMessage, {
				provider: this.id,
				error: error.stack,
			});

			throw new PaymentProviderError(errorMessage, this.id, code, error);
		}

		errorMessage = `${message}: ${String(error)}`;
		logger.error(errorMessage, {
			provider: this.id,
			error,
		});

		throw new PaymentProviderError(errorMessage, this.id, code);
	}

	// Abstract methods that must be implemented by providers
	abstract getPaymentStatus(userId: string): Promise<boolean>;
	abstract hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean>;
	abstract hasUserActiveSubscription(userId: string): Promise<boolean>;
	abstract getUserPurchasedProducts(userId: string): Promise<ProductData[]>;
	abstract getAllOrders(): Promise<OrderData[]>;
	abstract getOrdersByEmail(email: string): Promise<OrderData[]>;
	abstract getOrderById(orderId: string): Promise<OrderData | null>;
	abstract importPayments(): Promise<ImportStats>;
	abstract handleWebhookEvent(event: any): Promise<void>;
	abstract createCheckoutUrl(options: CheckoutOptions): Promise<string | null>;
	abstract listProducts(): Promise<ProductData[]>;

	/**
	 * Get user email by ID
	 * @param userId The user ID
	 * @returns The user's email or null if not found
	 */
	protected async getUserEmail(userId: string): Promise<string | null> {
		try {
			if (!db) {
				logger.warn("Database not initialized when getting user email", {
					userId,
					provider: this.id,
				});
				return null;
			}

			const user = await db
				.select({ email: users.email })
				.from(users)
				.where(eq(users.id, userId))
				.limit(1)
				.then((rows) => rows[0] || null);

			return user?.email ?? null;
		} catch (error) {
			logger.error("Error getting user email", {
				provider: this.id,
				userId,
				error,
			});
			return null;
		}
	}

	/**
	 * Generate a standardized order ID
	 * @param providerId The ID of the provider
	 * @param originalId The original order ID from the provider
	 * @returns A standardized order ID
	 */
	protected generateOrderId(providerId: string, originalId: string): string {
		return `${providerId}-${originalId}`;
	}

	/**
	 * Check if the provider is ready to use
	 * @throws {PaymentProviderError} If the provider is not ready
	 */
	protected checkProviderReady(): void {
		if (!this._isConfigured) {
			throw new PaymentProviderError(
				`Payment provider ${this.name} is not properly configured`,
				this.id,
				"provider_not_configured"
			);
		}

		if (!this._isEnabled) {
			throw new PaymentProviderError(
				`Payment provider ${this.name} is not enabled`,
				this.id,
				"provider_disabled"
			);
		}
	}
}
