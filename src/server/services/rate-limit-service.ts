import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { rateLimits as globalRateLimits } from "@/config/rate-limits";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { ErrorService } from "./error-service";

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
			logger.info("Redis rate limiting initialized");
			isInitialized = true;
		}
	}
} catch (error) {
	if (!isInitialized) {
		logger.error("Failed to initialize Redis for rate limiting", { error });
		isInitialized = true;
	}
}

export interface RateLimitConfig {
	requests: number;
	duration: number; // in seconds
	blockDuration?: number; // in seconds
}

export class RateLimitService {
	private limiters = new Map<string, Ratelimit>();
	private readonly enabled = !!redis;

	/**
	 * Gets or creates a rate limiter for a specific key
	 */
	private getLimiter(key: string, config: RateLimitConfig): Ratelimit {
		if (!this.enabled) {
			throw new Error("Rate limiting is not enabled");
		}

		const existingLimiter = this.limiters.get(key);
		if (existingLimiter) {
			return existingLimiter;
		}

		const limiter = new Ratelimit({
			redis: redis!,
			limiter: Ratelimit.slidingWindow(config.requests, `${config.duration}s`),
			analytics: true,
			prefix: `ratelimit:${key}`,
		});

		this.limiters.set(key, limiter);
		return limiter;
	}

	/**
	 * Checks if a request should be rate limited
	 */ async checkLimit(identifier: string, action: string, config: RateLimitConfig): Promise<void> {
		// Skip rate limiting if Redis is not available
		if (!this.enabled) {
			logger.debug("Rate limiting disabled, skipping check", {
				identifier,
				action,
			});
			return;
		}

		const limiter = this.getLimiter(`${action}:${identifier}`, config);
		const { success, limit, reset, remaining } = await limiter.limit(identifier);

		if (!success) {
			ErrorService.throwRateLimited("Too many requests", {
				limit,
				reset,
				remaining,
			});
		}
	}

	/**
	 * Gets the current rate limit status
	 */ async getStatus(
		identifier: string,
		action: string
	): Promise<{
		limit: number;
		remaining: number;
		reset: number;
	}> {
		if (!this.enabled) {
			return {
				limit: Number.POSITIVE_INFINITY,
				remaining: Number.POSITIVE_INFINITY,
				reset: 0,
			};
		}

		const key = `ratelimit:${action}:${identifier}`;
		// @ts-expect-error
		const [[limit], [remaining], [reset]] = await redis!
			.pipeline()
			.get(`${key}:limit`)
			.get(`${key}:remaining`)
			.get(`${key}:reset`)
			.exec();

		return {
			limit: Number(limit) || 0,
			remaining: Number(remaining) || 0,
			reset: Number(reset) || 0,
		};
	}

	/**
	 * Resets rate limit for a specific identifier and action
	 */ async resetLimit(identifier: string, action: string): Promise<void> {
		if (!this.enabled) return;

		const key = `ratelimit:${action}:${identifier}`;
		await redis!.pipeline().del(`${key}:limit`).del(`${key}:remaining`).del(`${key}:reset`).exec();
	}
}

export const rateLimitService = new RateLimitService();

// Common rate limit configurations
export const rateLimits = globalRateLimits;
