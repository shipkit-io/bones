"use server";

import { revalidatePath } from "next/cache";
import { cacheService } from "@/server/services/cache-service";
import { ErrorService } from "@/server/services/error-service";
import { metrics, metricsService } from "@/server/services/metrics-service";
import { rateLimitService, rateLimits } from "@/server/services/rate-limit-service";
import { userService } from "@/server/services/user-service";
import { ValidationService } from "@/server/services/validation-service";
import { updateProfileSchema, userSchema } from "./schemas";

/**
 * @fileoverview Server actions for user management - MUTATIONS ONLY
 * @module server/actions/users
 *
 * NOTE: Read operations should be performed directly via service calls:
 * - import { userService } from "@/server/services/user-service"
 * - userService.getUserByEmail(email)
 * - userService.getUserWithAssociations(userId)
 * - userService.getTeamUsers(teamId)
 * - userService.getProjectUsers(projectId)
 * - userService.hasTeamAccess(userId, teamId)
 * - userService.hasProjectAccess(userId, projectId)
 *
 * @see src/server/services/user-service.ts
 */

/**
 * Ensures a user exists in the database.
 * @returns The user with their details
 */
export async function ensureUserExists(authUser: {
	id: string;
	email: string;
	name?: string | null;
	image?: string | null;
}) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(authUser.id, "ensureUserExists", rateLimits.web.default);

		// Validation
		await ValidationService.validateOrThrow(userSchema, authUser);

		// Metrics start
		const startTime = Date.now();

		// Create or update user
		const user = await userService.ensureUserExists(authUser);

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);
		await metricsService.incrementCounter(metrics.auth.registrations);

		// Invalidate cache
		await cacheService.delete(`user:${user.id}`);
		await cacheService.delete(`user:${user.email}`);

		revalidatePath("/");
		return user;
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}

/**
 * Updates a user's profile information.
 * @returns The updated user
 */
export async function updateProfile(
	userId: string,
	data: {
		name?: string | null;
		image?: string | null;
	}
) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(userId, "updateProfile", rateLimits.web.forms);

		// Validation
		await ValidationService.validateOrThrow(updateProfileSchema, {
			userId,
			data,
		});

		// Metrics start
		const startTime = Date.now();

		// Update profile
		const user = await userService.updateProfile(userId, data);

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);

		// Invalidate cache
		await cacheService.delete(`user:${user?.id}`);
		await cacheService.delete(`user:${user?.email}`);
		await cacheService.delete(`user:${user?.id}:associations`);

		revalidatePath("/");
		return user;
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}

/**
 * Verifies a user's email address.
 * @returns The updated user
 */
export async function verifyEmail(userId: string) {
	try {
		// Rate limiting
		await rateLimitService.checkLimit(userId, "verifyEmail", rateLimits.api.auth);

		// Validation
		await ValidationService.validateOrThrow(userSchema, { id: userId });

		// Metrics start
		const startTime = Date.now();

		// Verify email
		const user = await userService.verifyEmail(userId);

		// Metrics end
		await metricsService.recordTiming(metrics.api.latency, startTime);
		await metricsService.incrementCounter(metrics.api.requests);

		// Invalidate cache
		await cacheService.delete(`user:${user?.id}`);
		await cacheService.delete(`user:${user?.email}`);

		revalidatePath("/");
		return user;
	} catch (error) {
		await metricsService.incrementCounter(metrics.api.errors);
		throw ErrorService.handleError(error);
	}
}
