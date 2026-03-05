/**
 * Payment provider types
 */
export type PaymentProcessor = "lemonsqueezy" | "polar" | "stripe";

/**
 * Import provider options including "all" to import from all providers
 */
export type ImportProvider = PaymentProcessor | "all";

/**
 * Import statistics
 */
export interface ImportStats {
	total: number;
	imported: number;
	skipped: number;
	errors: number;
	usersCreated: number;
}
