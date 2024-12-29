import { env } from "@/env";
import { logger } from "@/lib/logger";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ErrorService } from "./error-service";

// Try to create Redis instance if configured
let redis: Redis | null = null;
try {
	if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
		redis = new Redis({
			url: env.UPSTASH_REDIS_REST_URL,
			token: env.UPSTASH_REDIS_REST_TOKEN,
		});
		logger.info("Redis rate limiting initialized");
	} else {
		logger.info("Redis not configured, rate limiting disabled");
	}
} catch (error) {
	logger.error("Failed to initialize Redis for rate limiting", { error });
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
	 */
	async checkLimit(
		identifier: string,
		action: string,
		config: RateLimitConfig,
	): Promise<void> {
		// Skip rate limiting if Redis is not available
		if (!this.enabled) {
			logger.debug("Rate limiting disabled, skipping check", {
				identifier,
				action,
			});
			return;
		}

		const limiter = this.getLimiter(`${action}:${identifier}`, config);
		const { success, limit, reset, remaining } =
			await limiter.limit(identifier);

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
	 */
	async getStatus(
		identifier: string,
		action: string,
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
	 */
	async resetLimit(identifier: string, action: string): Promise<void> {
		if (!this.enabled) return;

		const key = `ratelimit:${action}:${identifier}`;
		await redis!
			.pipeline()
			.del(`${key}:limit`)
			.del(`${key}:remaining`)
			.del(`${key}:reset`)
			.exec();
	}
}

export const rateLimitService = new RateLimitService();

// Common rate limit configurations
export const rateLimits = {
	api: {
		default: {
			requests: 100,
			duration: 60, // 100 requests per minute
		},
		auth: {
			requests: 5,
			duration: 60, // 5 login attempts per minute
			blockDuration: 300, // 5 minutes block after exceeding
		},
		search: {
			requests: 30,
			duration: 60, // 30 searches per minute
		},
	},
	web: {
		default: {
			requests: 1000,
			duration: 60, // 1000 requests per minute
		},
		forms: {
			requests: 10,
			duration: 60, // 10 form submissions per minute
		},
	},
} as const;
