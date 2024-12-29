"use server";

import { auth } from "@/server/auth";
import { apiKeyService } from "@/server/services/api-key-service";
import { ErrorService } from "@/server/services/error-service";
import { ValidationService } from "@/server/services/validation-service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MILLISECONDS_IN_A_WEEK = 60 * 60 * 24 * 7 * 1000;

// Validation schemas in a separate object (not exported)
const schemas = {
	createApiKey: z.object({
		userId: z.string(),
		name: z.string().min(1, "Name is required"),
		description: z.string().optional(),
		expiresIn: z.string().optional(),
	}),
	validateApiKey: z.object({
		apiKey: z.string(),
	}),
} as const;

/**
 * Creates a new API key for a user
 */
export async function createApiKey(data: z.infer<typeof schemas.createApiKey>) {
	try {
		// Validate input
		await ValidationService.validateOrThrow(schemas.createApiKey, data);

		// Ensure user is authenticated and has permission
		const session = await auth();
		if (!session?.user) {
			ErrorService.throwUnauthorized(
				"You must be logged in to create an API key",
			);
		}

		// Ensure user can only create keys for themselves
		if (session.user.id !== data.userId) {
			ErrorService.throwUnauthorized(
				"You can only create API keys for yourself",
			);
		}

		// Convert expiresIn to milliseconds if provided
		const expiresIn = data.expiresIn
			? Number.parseInt(data.expiresIn) * MILLISECONDS_IN_A_WEEK
			: undefined;

		// Create the API key
		const apiKey = await apiKeyService.createApiKey({
			userId: data.userId,
			name: data.name,
			description: data.description,
			expiresIn,
		});

		// Revalidate the API keys page
		revalidatePath("/api-keys");

		// Return the API key - this is the only time it will be shown in full
		return { key: apiKey?.key };
	} catch (error) {
		throw ErrorService.handleError(error);
	}
}

/**
 * Creates a test API key for a user
 */
export async function createTestApiKey() {
	const session = await auth();

	const apiKey = await apiKeyService.createApiKey({
		userId: session?.user?.id ?? "",
		name: "API Key",
		description: "Generated for testing purposes",
	});

	return { key: apiKey?.key };
}

/**
 * Deletes an API key
 */
export async function deleteApiKey(apiKeyId: string) {
	try {
		// Ensure user is authenticated
		const session = await auth();
		if (!session?.user) {
			ErrorService.throwUnauthorized(
				"You must be logged in to delete an API key",
			);
		}

		console.log("session", session.user.id);
		console.log("apiKeyId", apiKeyId);
		// Get the API key to check ownership
		const apiKey = await apiKeyService.findById(apiKeyId);
		if (!apiKey) {
			ErrorService.throwNotFound("API key not found");
		}

		console.log("apiKey", apiKey);

		// Ensure user can only delete their own keys
		if (apiKey.userId && apiKey.userId !== session.user.id) {
			ErrorService.throwUnauthorized("You can only delete your own API keys");
		}

		// Delete the API key
		const success = await apiKeyService.delete(apiKeyId);

		// Revalidate the API keys page
		revalidatePath("/api-keys");

		return success;
	} catch (error) {
		throw ErrorService.handleError(error);
	}
}

/**
 * Validates an API key
 */
export async function validateApiKey(apiKey: string) {
	try {
		await ValidationService.validateOrThrow(schemas.validateApiKey, { apiKey });
		return await apiKeyService.validateApiKey(apiKey);
	} catch (error) {
		throw ErrorService.handleError(error);
	}
}
