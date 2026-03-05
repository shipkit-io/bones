/**
 * Payment Providers Module
 *
 * This module centralizes the initialization and registration of payment providers.
 * It exports helper functions to work with the provider registry.
 */

import { env } from "@/env";
import { paymentProviderRegistry } from "./registry";
import type { PaymentProvider } from "./types";

// Export base classes, types, and the registry instance
export { BasePaymentProvider } from "./base-provider";
export * from "./types";
export { paymentProviderRegistry }; // Keep registry exported

// Flag to track if initialization has run
let hasInitialized = false;

/**
 * Initialize all available payment providers asynchronously using dynamic imports.
 * This function should be called explicitly once during application startup.
 */
export async function initializePaymentProviders(): Promise<void> {
	// Prevent re-initialization
	if (hasInitialized) {
		return;
	}

	const initializers: Promise<void>[] = [];

	// Conditionally register and initialize LemonSqueezy
	if (env.NEXT_PUBLIC_FEATURE_LEMONSQUEEZY_ENABLED) {
		initializers.push(
			(async () => {
				try {
					// Dynamically import the provider
					const { lemonSqueezyProvider } = await import("./lemonsqueezy-provider");
					paymentProviderRegistry.register(lemonSqueezyProvider);

					// The provider auto-initializes in its constructor, but ensure it's properly configured
					if (!lemonSqueezyProvider.isConfigured) {
						lemonSqueezyProvider.initialize({
							apiKey: env.LEMONSQUEEZY_API_KEY,
							// Pass other config like sandbox if needed
							// sandbox: env.LEMONSQUEEZY_SANDBOX === 'true',
						});
					}
				} catch (error) {
					console.error("❌ Failed to initialize LemonSqueezy Provider", { error });
				}
			})()
		);
	}

	// Conditionally register and initialize Polar
	if (env.NEXT_PUBLIC_FEATURE_POLAR_ENABLED) {
		initializers.push(
			(async () => {
				try {
					// Dynamically import the provider
					const { polarProvider } = await import("./polar-provider");
					// Register the Polar provider
					paymentProviderRegistry.register(polarProvider);

					// Initialize Polar with the API key from environment variables
					polarProvider.initialize({
						apiKey: env.POLAR_ACCESS_TOKEN, // Use the validated env var
						// Pass other config like sandbox if needed
					});
					console.info("✅ Polar Provider Initialized");
				} catch (error) {
					console.error("❌ Failed to initialize Polar Provider", { error });
				}
			})()
		);
	}

	// Conditionally register and initialize Stripe
	if (env.NEXT_PUBLIC_FEATURE_STRIPE_ENABLED) {
		initializers.push(
			(async () => {
				try {
					// Dynamically import the provider
					const { stripeProvider } = await import("./stripe-provider");
					// Register the Stripe provider
					paymentProviderRegistry.register(stripeProvider);

					// Initialize Stripe with the API key from environment variables
					stripeProvider.initialize({
						apiKey: env.STRIPE_SECRET_KEY,
						publishableKey: env.STRIPE_PUBLISHABLE_KEY,
						webhookSecret: env.STRIPE_WEBHOOK_SECRET,
						// Pass other config like sandbox if needed
					} as any); // Cast to any since StripeProviderConfig extends ProviderConfig
					console.info("✅ Stripe Provider Initialized");
				} catch (error) {
					console.error("❌ Failed to initialize Stripe Provider", { error });
				}
			})()
		);
	}

	// Wait for all initializations to complete
	await Promise.all(initializers);

	// console.info("Payment providers initialization complete\n", {
	// 	totalRegistered: paymentProviderRegistry.count,
	// 	enabled: paymentProviderRegistry.enabledCount, // Note: This relies on initialize() setting isEnabled correctly
	// });

	// Mark as initialized
	hasInitialized = true;
}

/**
 * Get all enabled payment providers
 * @returns Array of enabled providers
 */
export function getEnabledProviders(): PaymentProvider[] {
	// Filter based on the isEnabled flag set during initialize
	return paymentProviderRegistry.getAll().filter((provider) => provider.isEnabled);
}

/**
 * Get a payment provider by ID
 * @param id Provider ID
 * @returns The provider if found, undefined otherwise
 */
export function getProvider(id: string): PaymentProvider | undefined {
	return paymentProviderRegistry.get(id);
}

/**
 * Check if a provider with the given ID is registered
 * @param id Provider ID
 * @returns Whether the provider is registered
 */
export function hasProvider(id: string): boolean {
	return paymentProviderRegistry.has(id);
}

/**
 * Check if a provider with the given ID is enabled
 * @param id Provider ID
 * @returns Whether the provider is enabled
 */
export function isProviderEnabled(id: string): boolean {
	const provider = paymentProviderRegistry.get(id);
	// Ensure provider exists and its isEnabled flag is true
	return !!provider?.isEnabled;
}
