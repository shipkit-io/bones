import { siteConfig } from "@/config/site";
import { db } from "@/server/db";
import { apiKeys, users } from "@/server/db/schema";
import crypto from "crypto";
import { eq, isNull } from "drizzle-orm";

export class ApiKeyService {
	/**
	 * Generates a URL-safe API key using crypto.getRandomValues
	 * Format: prefix_base62string
	 * Example: pk_7FzR9W3kM8vNpL2xJqY4tH5gQcAaBbCcDdEeFf
	 */
	private generateApiKey(prefix: string = siteConfig.app.apiKeyPrefix): string {
		// Use a larger array for better entropy
		const array = new Uint8Array(40);
		crypto.getRandomValues(array);

		// Convert to base62 (alphanumeric only, no special chars)
		const base62Chars =
			"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		let result = "";

		for (const byte of array) {
			// Use modulo to map the byte to our character set
			result += base62Chars[byte % 62];
		}

		// Add prefix and underscore separator
		return `${prefix}_${result}`;
	}

	/**
	 * Gets all API keys for a user.
	 * @param userId - The ID of the user
	 * @returns The user's API keys
	 */
	async getUserApiKeys(userId: string) {
		return await db
			.select({
				apiKey: apiKeys,
				user: users,
			})
			.from(apiKeys)
			.leftJoin(users, eq(apiKeys.userId, users.id))
			.where(eq(apiKeys.userId, userId) && isNull(apiKeys.deletedAt));
	}

	/**
	 * Find an API key by ID
	 * @param id - The ID of the API key
	 * @returns The API key or null if not found
	 */
	async findById(id: string) {
		const apiKey = await db.query.apiKeys.findFirst({
			where: (apiKeys, { eq }) => eq(apiKeys.id, id),
			// Include related data to ensure we get the userId
			with: {
				user: true,
				project: true,
			},
		});

		return apiKey;
	}

	/**
	 * Creates a new API key for a user.
	 * @param userId - The ID of the user
	 * @param name - The name of the API key
	 * @param description - Optional description of the API key
	 * @param expiresIn - Optional expiration time in milliseconds
	 * @returns The created API key
	 */
	async createApiKey({
		userId,
		name,
		description,
		expiresIn,
	}: {
		userId?: string;
		name?: string;
		description?: string;
		expiresIn?: number;
	}) {
		if (!db) {
			throw new Error("Database is not initialized");
		}

		const key = this.generateApiKey();
		let expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null;

		if (!userId) {
			expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
		}

		const [apiKey] = await db
			.insert(apiKeys)
			.values({
				key,
				userId: userId || null,
				name: name || null,
				description: description || null,
				expiresAt,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		console.log("apiKey", apiKey);
		return apiKey;
	}

	/**
	 * Validates an API key.
	 * @param key - The API key to validate
	 * @returns The API key with its user details if valid
	 */
	async validateApiKey(key: string) {
		const [result] = await db
			.select({
				apiKey: apiKeys,
				user: users,
			})
			.from(apiKeys)
			.leftJoin(users, eq(apiKeys.userId, users.id))
			.where(eq(apiKeys.key, key) && isNull(apiKeys.deletedAt))
			.limit(1);

		if (!result) {
			throw new Error("Invalid API key");
		}

		// Check if key is expired
		if (
			result.apiKey.expiresAt &&
			new Date(result.apiKey.expiresAt) < new Date()
		) {
			throw new Error("API key has expired");
		}

		return result;
	}

	/**
	 * Updates the last used timestamp of an API key.
	 * @param keyId - The ID of the API key
	 */
	async updateLastUsed(keyId: string) {
		await db
			.update(apiKeys)
			.set({ lastUsedAt: new Date() })
			.where(eq(apiKeys.id, keyId));
	}

	/**
	 * Deletes an API key by ID
	 * @param id - The ID of the API key to delete
	 * @returns True if deleted, false if not found
	 */
	async delete(id: string) {
		const [deleted] = await db
			.update(apiKeys)
			.set({
				deletedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(apiKeys.id, id))
			.returning();
		return !!deleted;
	}
}
export const apiKeyService = new ApiKeyService();
