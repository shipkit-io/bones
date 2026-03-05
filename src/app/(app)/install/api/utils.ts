/**
 * Shared utilities for API routes
 * Re-exports server-safe functionality from app/install/shared-utils.ts
 */
import {
	BINARY_EXTENSIONS,
	CONTENT_TYPE_MAP,
	getContentType,
	sanitizePath,
	shouldIgnoreFile,
	TEMPLATE_BASE_DIR,
} from "../shared-utils";

// Export utilities that are also used in the API routes
export {
	BINARY_EXTENSIONS,
	CONTENT_TYPE_MAP,
	TEMPLATE_BASE_DIR,
	getContentType,
	sanitizePath,
	shouldIgnoreFile,
};

// Cache for directory listings (API-specific)
export const directoryCache = new Map<string, any[]>();

// Cache for file content (API-specific)
export const fileContentCache = new Map<
	string,
	{ content: Buffer | string; contentType: string }
>();
