/**
 * Performance Utilities for Next.js 15
 *
 * Helpers for fetch caching, performance monitoring, and optimization
 */

/**
 * Standard fetch cache configurations for different use cases
 */
export const fetchConfigs = {
	/** No caching - always fresh data */
	noCache: { cache: "no-store" as const },

	/** Cache with immediate revalidation check */
	revalidate: { next: { revalidate: 0 } },

	/** Short-term caching (1 minute) */
	short: { next: { revalidate: 60 } },

	/** Medium-term caching (5 minutes) */
	medium: { next: { revalidate: 300 } },

	/** Long-term caching (1 hour) */
	long: { next: { revalidate: 3600 } },

	/** Static caching (24 hours) */
	static: { next: { revalidate: 86400 } },

	/** Force caching */
	forceCache: { cache: "force-cache" as const },
} as const;

/**
 * Segment-level fetch cache configurations
 * Use as: export const fetchCache = 'default-cache'
 */
export const segmentFetchConfigs = {
	defaultCache: "default-cache" as const,
	defaultNoStore: "default-no-store" as const,
	forceCache: "force-cache" as const,
	onlyCache: "only-cache" as const,
	forceNoStore: "force-no-store" as const,
	onlyNoStore: "only-no-store" as const,
} as const;

/**
 * Performance monitoring helpers
 */
const timers = new Map<string, number>();

export const PerformanceMonitor = {
	/**
	 * Start timing an operation
	 */
	start(label: string): void {
		timers.set(label, performance.now());
	},

	/**
	 * End timing and log the duration
	 */
	end(label: string): number {
		const start = timers.get(label);
		if (!start) {
			console.warn(`Timer '${label}' was not started`);
			return 0;
		}

		const duration = performance.now() - start;
		timers.delete(label);

		if (process.env.NODE_ENV === "development") {
			console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
		}

		return duration;
	},

	/**
	 * Measure an async operation
	 */
	async measure<T>(label: string, operation: () => Promise<T>): Promise<T> {
		this.start(label);
		try {
			const result = await operation();
			this.end(label);
			return result;
		} catch (error) {
			this.end(label);
			throw error;
		}
	},
};

/**
 * Web Vitals tracking for Next.js 15
 */
export interface WebVitalsMetric {
	id: string;
	name: string;
	value: number;
	label: "web-vital" | "custom";
	startTime?: number;
}

/**
 * Enhanced fetch helper with automatic caching configuration
 */
export async function optimizedFetch(
	url: string,
	options: RequestInit & { cacheStrategy?: keyof typeof fetchConfigs } = {}
): Promise<Response> {
	const { cacheStrategy = "medium", ...fetchOptions } = options;

	const cacheConfig = fetchConfigs[cacheStrategy];

	if (process.env.NODE_ENV === "development") {
		console.log(`🌐 Fetch ${url} with ${cacheStrategy} caching`);
	}

	return fetch(url, {
		...fetchOptions,
		...cacheConfig,
	});
}

/**
 * Preload helper for critical resources
 */
export function preloadResource(href: string, as: string): void {
	if (typeof window !== "undefined") {
		const link = document.createElement("link");
		link.rel = "preload";
		link.href = href;
		link.as = as;
		document.head.appendChild(link);
	}
}

/**
 * Resource hints for improved loading
 */
export function addResourceHints(hints: { href: string; rel: string; as?: string }[]): void {
	if (typeof window !== "undefined") {
		for (const { href, rel, as } of hints) {
			const link = document.createElement("link");
			link.rel = rel;
			link.href = href;
			if (as) link.as = as;
			document.head.appendChild(link);
		}
	}
}

/**
 * Image optimization helper
 */
export function getOptimizedImageSrc(src: string, width: number, quality = 75): string {
	// If it's a Next.js optimized image, add parameters
	if (src.startsWith("/_next/image")) {
		const url = new URL(src, window.location.origin);
		url.searchParams.set("w", width.toString());
		url.searchParams.set("q", quality.toString());
		return url.toString();
	}

	return src;
}

export default {
	fetchConfigs,
	segmentFetchConfigs,
	PerformanceMonitor,
	optimizedFetch,
	preloadResource,
	addResourceHints,
	getOptimizedImageSrc,
};
