import { Redis } from "@upstash/redis";
import { env } from "@/env";
import { logger } from "@/lib/logger";

// Try to create Redis instance if configured
let redis: Redis | null = null;
let isInitialized = false;

try {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    if (!isInitialized) {
      logger.info("Redis metrics initialized");
      isInitialized = true;
    }
  }
} catch (error) {
  if (!isInitialized) {
    logger.error("Failed to initialize Redis for metrics", { error });
    isInitialized = true;
  }
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

  /**
   * Returns the Redis client, or null when metrics are disabled because Redis
   * was never configured. Callers narrow on the result instead of asserting.
   */
  private get client(): Redis | null {
    return redis;
  }

  /**
   * Records a metric value
   */
  async recordMetric(
    name: string,
    value: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const client = this.client;
    if (!client) return;

    const metric: MetricData = {
      value,
      timestamp: Date.now(),
      metadata,
    };

    try {
      await client.zadd(`${this.prefix}:${name}`, {
        score: metric.timestamp,
        member: JSON.stringify(metric),
      });
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
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.client) return;
    const duration = Date.now() - startTime;
    await this.recordMetric(name, duration, metadata);
  }

  /**
   * Increments a counter metric
   */
  async incrementCounter(
    name: string,
    value = 1,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const client = this.client;
    if (!client) return;

    try {
      const key = `${this.prefix}:counter:${name}`;
      await client
        .pipeline()
        .incrby(key, value)
        .zadd(`${this.prefix}:${name}`, {
          score: Date.now(),
          member: JSON.stringify({
            value,
            timestamp: Date.now(),
            metadata,
          }),
        })
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
  async getMetrics(name: string, query: MetricQuery = {}): Promise<MetricData[]> {
    const client = this.client;
    if (!client) return [];

    const { from = 0, to = Date.now(), limit } = query;

    try {
      const metrics = await client.zrange(`${this.prefix}:${name}`, from, to, { byScore: true });

      return metrics.map((metric) => JSON.parse(String(metric)) as MetricData).slice(0, limit);
    } catch (error) {
      logger.error("Failed to get metrics", { name, query, error });
      return [];
    }
  }

  /**
   * Gets the current value of a counter
   */
  async getCounter(name: string): Promise<number> {
    const client = this.client;
    if (!client) return 0;

    try {
      const value = await client.get(`${this.prefix}:counter:${name}`);
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
    const client = this.client;
    if (!client) return;

    try {
      await client.del(`${this.prefix}:counter:${name}`);
    } catch (error) {
      logger.error("Failed to reset counter", { name, error });
    }
  }

  /**
   * Cleans up old metrics data
   */
  async cleanup(retentionDays = 30): Promise<void> {
    const client = this.client;
    if (!client) return;

    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    try {
      const keys = await client.keys(`${this.prefix}:*`);
      for (const key of keys) {
        if (key.includes("counter")) continue;
        await client.zremrangebyscore(key, 0, cutoff);
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
