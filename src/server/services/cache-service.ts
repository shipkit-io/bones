import { env } from "@/env";
import { logger } from "@/lib/logger";
import { Redis } from "@upstash/redis";
import { metrics, metricsService } from "./metrics-service";

// Try to create Redis instance if configured
let redis: Redis | null = null;
try {
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
        });
        logger.info("Redis cache initialized");
    } else {
        logger.info("Redis not configured, caching disabled");
    }
} catch (error) {
    logger.error("Failed to initialize Redis", { error });
}

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

        try {
            const startTime = Date.now();
            const data = await redis!.get(`${this.prefix}:${key}`);
            await metricsService.recordTiming(metrics.cache.latency, startTime);

            if (!data) {
                await metricsService.incrementCounter(metrics.cache.misses);
                return null;
            }

            await metricsService.incrementCounter(metrics.cache.hits);
            return JSON.parse(data) as T;
        } catch (error) {
            logger.error("Failed to get from cache", { key, error });
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
                await redis!.setex(
                    `${this.prefix}:${key}`,
                    config.ttl,
                    JSON.stringify(entry),
                );
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
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        config: CacheConfig = {},
    ): Promise<T> {
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
        return (
            age >= config.ttl * 1000 &&
            age < (config.ttl + config.staleWhileRevalidate) * 1000
        );
    }

    /**
     * Revalidates a cached value in the background
     */
    private async revalidate<T>(
        key: string,
        factory: () => Promise<T>,
        config: CacheConfig,
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
