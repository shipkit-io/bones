import { env } from "@/env";
import { logger } from "@/lib/logger";
import { metrics, metricsService } from "./metrics-service";
import { redisClient as redis } from "./redis-service"; // Import the shared client

export interface CacheConfig {
	ttl?: number; // Time to live in seconds
	staleWhileRevalidate?: number; // Additional time to serve stale content while revalidating
}

export interface CacheEntry<T> {
	data: T;
	createdAt: number;
	updatedAt: number;
}

export class CacheService {
	private readonly prefix = "cache";
	private readonly enabled = !!redis;

	/**
	 * Gets a value from cache
	 */
	async get<T>(key: string): Promise<T | null> {
		if (!this.enabled) return null;

		let rawData: string | Record<string, unknown> | null = null;
		try {
			const startTime = Date.now();
			rawData = await redis!.get(`${this.prefix}:${key}`);
			await metricsService.recordTiming(metrics.cache.latency, startTime);

			if (rawData === null) {
				await metricsService.incrementCounter(metrics.cache.misses);
				return null;
			}

			// Ensure data is a string before parsing
			if (typeof rawData !== "string") {
				logger.error("Invalid data type received from cache", {
					key,
					type: typeof rawData,
				});
				await metricsService.incrementCounter(metrics.cache.errors);
				return null;
			}

			// Now parse the string data
			try {
				const parsedData = JSON.parse(rawData) as CacheEntry<T>;
				await metricsService.incrementCounter(metrics.cache.hits);
				// Check if the parsed data has the expected structure (basic check)
				if (typeof parsedData === "object" && parsedData !== null && "data" in parsedData) {
					return parsedData.data;
				}

				// If structure is invalid, log error, delete entry, and return null
				logger.error("Parsed cache data lacks expected structure", { key });
				await metricsService.incrementCounter(metrics.cache.errors);
				await this.delete(key); // Delete invalid entry
				return null;
			} catch (parseError) {
				logger.error("Failed to parse cache data", { key, data: rawData, error: parseError });
				await metricsService.incrementCounter(metrics.cache.errors);
				await this.delete(key); // Delete invalid entry
				return null;
			}
		} catch (error) {
			logger.error("Failed to get from cache (Redis operation error)", { key, error });
			await metricsService.incrementCounter(metrics.cache.errors);
			return null;
		}
	}

	/**
	 * Sets a value in cache
	 */
	async set<T>(key: string, value: T, config: CacheConfig = {}): Promise<void> {
		if (!this.enabled) return;

		try {
			const entry: CacheEntry<T> = {
				data: value,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			if (config.ttl) {
				await redis!.setex(`${this.prefix}:${key}`, config.ttl, JSON.stringify(entry));
			} else {
				await redis!.set(`${this.prefix}:${key}`, JSON.stringify(entry));
			}
		} catch (error) {
			logger.error("Failed to set cache", { key, error });
			await metricsService.incrementCounter(metrics.cache.errors);
		}
	}

	/**
	 * Deletes a value from cache
	 */
	async delete(key: string): Promise<void> {
		if (!this.enabled) return;

		try {
			await redis!.del(`${this.prefix}:${key}`);
		} catch (error) {
			logger.error("Failed to delete from cache", { key, error });
			await metricsService.incrementCounter(metrics.cache.errors);
		}
	}

	/**
	 * Gets a value from cache or computes it if not found
	 */
	async getOrSet<T>(key: string, factory: () => Promise<T>, config: CacheConfig = {}): Promise<T> {
		// If caching is disabled, just compute the value
		if (!this.enabled) {
			return factory();
		}

		const cached = await this.get<CacheEntry<T>>(key);

		// If we have a cached value and it's not stale, return it
		if (cached && this.isValid(cached, config)) {
			return cached.data;
		}

		// If we have a stale value and staleWhileRevalidate is set,
		// revalidate in the background and return stale data
		if (cached && config.staleWhileRevalidate && this.isStale(cached, config)) {
			void this.revalidate(key, factory, config);
			return cached.data;
		}

		// Otherwise, compute the value and cache it
		const value = await factory();
		await this.set(key, value, config);
		return value;
	}

	/**
	 * Checks if a cached entry is still valid
	 */
	private isValid(entry: CacheEntry<unknown>, config: CacheConfig): boolean {
		if (!config.ttl) return true;
		const age = Date.now() - entry.updatedAt;
		return age < config.ttl * 1000;
	}

	/**
	 * Checks if a cached entry is stale but still usable
	 */
	private isStale(entry: CacheEntry<unknown>, config: CacheConfig): boolean {
		if (!config.ttl || !config.staleWhileRevalidate) return false;
		const age = Date.now() - entry.updatedAt;
		return age >= config.ttl * 1000 && age < (config.ttl + config.staleWhileRevalidate) * 1000;
	}

	/**
	 * Revalidates a cached value in the background
	 */
	private async revalidate<T>(
		key: string,
		factory: () => Promise<T>,
		config: CacheConfig
	): Promise<void> {
		try {
			const value = await factory();
			await this.set(key, value, config);
		} catch (error) {
			logger.error("Failed to revalidate cache", { key, error });
			await metricsService.incrementCounter(metrics.cache.errors);
		}
	}
}

export const cacheService = new CacheService();

// Common cache configurations
export const cacheConfigs = {
	short: {
		ttl: 60, // 1 minute
		staleWhileRevalidate: 60, // 1 minute
	},
	medium: {
		ttl: 300, // 5 minutes
		staleWhileRevalidate: 300, // 5 minutes
	},
	long: {
		ttl: 3600, // 1 hour
		staleWhileRevalidate: 1800, // 30 minutes
	},
	day: {
		ttl: 86400, // 24 hours
		staleWhileRevalidate: 3600, // 1 hour
	},
} as const;
