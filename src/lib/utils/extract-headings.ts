export interface Heading {
	id: string;
	text: string;
	level: number;
}

/**
 * Cache for heading extraction results
 * Key: content hash, Value: { headings, timestamp }
 */
interface HeadingCacheEntry {
	headings: Heading[];
	timestamp: number;
}

// In-memory cache for heading extraction
const headingCache = new Map<string, HeadingCacheEntry>();

// Cache configuration
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_SIZE = 1000; // Maximum number of cached entries

/**
 * Generate a simple hash for content caching
 */
function generateContentHash(content: string): string {
	let hash = 0;
	if (content.length === 0) return hash.toString();

	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	return Math.abs(hash).toString(36);
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache(): void {
	const now = Date.now();
	for (const [key, entry] of headingCache.entries()) {
		if (now - entry.timestamp > CACHE_TTL) {
			headingCache.delete(key);
		}
	}
}

/**
 * Ensure cache size doesn't exceed maximum
 */
function ensureCacheSize(): void {
	if (headingCache.size > MAX_CACHE_SIZE) {
		// Remove oldest entries (simple FIFO)
		const entries = Array.from(headingCache.entries());
		entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

		const toRemove = entries.slice(0, headingCache.size - MAX_CACHE_SIZE + 1);
		toRemove.forEach(([key]) => headingCache.delete(key));
	}
}

/**
 * Generate a URL-friendly slug from text
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "") // Remove special characters
		.replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
		.replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Extract headings from MDX content (with caching)
 */
export function extractHeadings(content: string): Heading[] {
	// Generate cache key
	const cacheKey = generateContentHash(content);

	// Check cache first
	const cached = headingCache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.headings;
	}

	// Extract headings if not in cache or expired
	const headingRegex = /^(#{1,6})\s+(.+)$/gm;
	const headings: Heading[] = [];
	let match;

	while ((match = headingRegex.exec(content)) !== null) {
		const level = match[1]?.length ?? 0;
		const text = match[2]?.trim() ?? "";
		const id = slugify(text);

		headings.push({
			id,
			text,
			level,
		});
	}

	// Cache the result
	headingCache.set(cacheKey, {
		headings,
		timestamp: Date.now(),
	});

	// Perform cache maintenance
	cleanExpiredCache();
	ensureCacheSize();

	return headings;
}

/**
 * Clear the heading extraction cache
 */
export function clearHeadingCache(): void {
	headingCache.clear();
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getHeadingCacheStats(): {
	size: number;
	maxSize: number;
	ttl: number;
} {
	return {
		size: headingCache.size,
		maxSize: MAX_CACHE_SIZE,
		ttl: CACHE_TTL,
	};
}

/**
 * Filter headings by level range (useful for TOC depth control)
 */
export function filterHeadingsByLevel(headings: Heading[], minLevel = 1, maxLevel = 4): Heading[] {
	return headings.filter((heading) => heading.level >= minLevel && heading.level <= maxLevel);
}
