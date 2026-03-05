import { logger } from "@/lib/logger";
import type { PaymentProvider } from "./types";

/**
 * Registry for payment providers
 * Manages the registration and retrieval of payment providers
 */
export class PaymentProviderRegistry {
	private providers = new Map<string, PaymentProvider>();
	private enabledProviders: string[] = [];

	/**
	 * Register a payment provider
	 * @param provider The provider to register
	 */
	public register(provider: PaymentProvider): void {
		if (this.providers.has(provider.id)) {
			logger.warn(`Provider ${provider.id} is already registered and will be overwritten`);
		}

		this.providers.set(provider.id, provider);
		// logger.debug(`Registered payment provider: ${provider.id}`);

		// Automatically enable the provider if it's configured
		if (provider.isConfigured) {
			this.enableProvider(provider.id);
		}
	}

	/**
	 * Enable a provider by ID
	 * @param providerId The ID of the provider to enable
	 * @returns True if the provider was enabled, false otherwise
	 */
	enableProvider(providerId: string): boolean {
		const provider = this.providers.get(providerId);

		if (!provider) {
			logger.warn(`Cannot enable provider with ID ${providerId}: provider not found`);
			return false;
		}

		if (!provider.isConfigured) {
			logger.warn(`Cannot enable provider ${provider.name}: provider is not properly configured`);
			return false;
		}

		if (!this.enabledProviders.includes(providerId)) {
			this.enabledProviders.push(providerId);
			// logger.debug(`Enabled payment provider: ${provider.name}`);
		}

		return true;
	}

	/**
	 * Disable a provider by ID
	 * @param providerId The ID of the provider to disable
	 */
	disableProvider(providerId: string): void {
		const provider = this.providers.get(providerId);

		if (!provider) {
			logger.warn(`Cannot disable provider with ID ${providerId}: provider not found`);
			return;
		}

		const index = this.enabledProviders.indexOf(providerId);
		if (index !== -1) {
			this.enabledProviders.splice(index, 1);
			logger.info(`Disabled payment provider: ${provider.name}`);
		}
	}

	/**
	 * Get a payment provider by ID
	 * @param id The ID of the provider to get
	 * @returns The provider, or undefined if not found
	 */
	public get(id: string): PaymentProvider | undefined {
		return this.providers.get(id);
	}

	/**
	 * Check if a provider is registered
	 * @param id The ID of the provider to check
	 * @returns True if the provider is registered
	 */
	public has(id: string): boolean {
		return this.providers.has(id);
	}

	/**
	 * Get all registered providers
	 * @returns Array of all providers
	 */
	public getAll(): PaymentProvider[] {
		return Array.from(this.providers.values());
	}

	/**
	 * Get all enabled providers
	 * @returns Array of all enabled providers
	 */
	getEnabledProviders(): PaymentProvider[] {
		return this.enabledProviders
			.map((id) => this.providers.get(id))
			.filter((provider): provider is PaymentProvider => provider !== undefined);
	}

	/**
	 * Remove a provider from the registry
	 * @param id The ID of the provider to remove
	 * @returns True if the provider was removed, false if it wasn't found
	 */
	public remove(id: string): boolean {
		logger.debug(`Removing payment provider: ${id}`);
		return this.providers.delete(id);
	}

	/**
	 * Get the number of registered providers
	 */
	public get count(): number {
		return this.providers.size;
	}

	/**
	 * Get the number of enabled providers
	 */
	public get enabledCount(): number {
		return this.getAll().filter((provider) => provider.isEnabled).length;
	}
}

// Create and export a singleton instance
export const paymentProviderRegistry = new PaymentProviderRegistry();
