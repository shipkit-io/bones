import { env } from "@/env";
import { logger } from "@/lib/logger";
import { Redis } from "@upstash/redis";

// Try to create Redis instance if configured
let redis: Redis | null = null;
try {
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
        });
        logger.info("Redis metrics initialized");
    } else {
        logger.info("Redis not configured, metrics collection disabled");
    }
} catch (error) {
    logger.error("Failed to initialize Redis for metrics", { error });
}

export interface MetricData {
    value: number;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

export interface MetricQuery {
    from?: number;
    to?: number;
    limit?: number;
}

export class MetricsService {
    private readonly prefix = "metrics";
    private readonly enabled = !!redis;

    /**
     * Records a metric value
     */
    async recordMetric(
        name: string,
        value: number,
        metadata?: Record<string, unknown>,
    ): Promise<void> {
        if (!this.enabled) return;

        const metric: MetricData = {
            value,
            timestamp: Date.now(),
            metadata,
        };

        try {
            await redis!.zadd(
                `${this.prefix}:${name}`,
                metric.timestamp,
                JSON.stringify(metric),
            );
        } catch (error) {
            logger.error("Failed to record metric", {
                name,
                value,
                metadata,
                error,
            });
        }
    }

    /**
     * Records a timing metric
     */
    async recordTiming(
        name: string,
        startTime: number,
        metadata?: Record<string, unknown>,
    ): Promise<void> {
        if (!this.enabled) return;
        const duration = Date.now() - startTime;
        await this.recordMetric(name, duration, metadata);
    }

    /**
     * Increments a counter metric
     */
    async incrementCounter(
        name: string,
        value = 1,
        metadata?: Record<string, unknown>,
    ): Promise<void> {
        if (!this.enabled) return;

        try {
            const key = `${this.prefix}:counter:${name}`;
            await redis!
                .pipeline()
                .incrby(key, value)
                .zadd(
                    `${this.prefix}:${name}`,
                    Date.now(),
                    JSON.stringify({
                        value,
                        timestamp: Date.now(),
                        metadata,
                    } as MetricData),
                )
                .exec();
        } catch (error) {
            logger.error("Failed to increment counter", {
                name,
                value,
                metadata,
                error,
            });
        }
    }

    /**
     * Gets metrics for a specific name and time range
     */
    async getMetrics(
        name: string,
        query: MetricQuery = {},
    ): Promise<MetricData[]> {
        if (!this.enabled) return [];

        const { from = 0, to = Date.now(), limit } = query;

        try {
            const metrics = await redis!.zrangebyscore(
                `${this.prefix}:${name}`,
                from,
                to,
            );

            return metrics
                .map((metric) => JSON.parse(metric) as MetricData)
                .slice(0, limit);
        } catch (error) {
            logger.error("Failed to get metrics", { name, query, error });
            return [];
        }
    }

    /**
     * Gets the current value of a counter
     */
    async getCounter(name: string): Promise<number> {
        if (!this.enabled) return 0;

        try {
            const value = await redis!.get(`${this.prefix}:counter:${name}`);
            return Number(value) || 0;
        } catch (error) {
            logger.error("Failed to get counter", { name, error });
            return 0;
        }
    }

    /**
     * Resets a counter to zero
     */
    async resetCounter(name: string): Promise<void> {
        if (!this.enabled) return;

        try {
            await redis!.del(`${this.prefix}:counter:${name}`);
        } catch (error) {
            logger.error("Failed to reset counter", { name, error });
        }
    }

    /**
     * Cleans up old metrics data
     */
    async cleanup(retentionDays = 30): Promise<void> {
        if (!this.enabled) return;

        const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

        try {
            const keys = await redis!.keys(`${this.prefix}:*`);
            for (const key of keys) {
                if (key.includes("counter")) continue;
                await redis!.zremrangebyscore(key, 0, cutoff);
            }
        } catch (error) {
            logger.error("Failed to cleanup metrics", { error });
        }
    }
}

export const metricsService = new MetricsService();

// Common metric names
export const metrics = {
    api: {
        requests: "api.requests",
        errors: "api.errors",
        latency: "api.latency",
    },
    auth: {
        logins: "auth.logins",
        failures: "auth.failures",
        registrations: "auth.registrations",
    },
    db: {
        queries: "db.queries",
        errors: "db.errors",
        latency: "db.latency",
    },
    cache: {
        hits: "cache.hits",
        misses: "cache.misses",
        errors: "cache.errors",
        latency: "cache.latency",
    },
} as const;
